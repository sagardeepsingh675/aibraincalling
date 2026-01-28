import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../utils/logger.js';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../config/index.js';
import fs from 'fs/promises';

const router = express.Router();
const execAsync = promisify(exec);

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

// Get all service statuses
router.get('/status', async (req, res) => {
    try {
        const statuses: Record<string, any> = {};

        // Check Asterisk status
        try {
            const { stdout: asteriskStatus } = await execAsync('sudo systemctl is-active asterisk');
            statuses.asterisk = {
                status: asteriskStatus.trim() === 'active' ? 'running' : 'stopped',
                active: asteriskStatus.trim() === 'active'
            };

            // Get Asterisk channels
            try {
                const { stdout: channels } = await execAsync('sudo asterisk -rx "core show channels count"');
                const match = channels.match(/(\d+) active channel/);
                statuses.asterisk.activeChannels = match ? parseInt(match[1]) : 0;
            } catch {
                statuses.asterisk.activeChannels = 0;
            }
        } catch {
            statuses.asterisk = { status: 'stopped', active: false, activeChannels: 0 };
        }

        // Check AI Brain status (pm2)
        try {
            const { stdout: pm2Status } = await execAsync('pm2 jlist');
            const processes = JSON.parse(pm2Status);
            const aiBrain = processes.find((p: any) => p.name === 'ai-brain');
            statuses.aiBrain = {
                status: aiBrain?.pm2_env?.status || 'stopped',
                active: aiBrain?.pm2_env?.status === 'online',
                memory: aiBrain?.monit?.memory || 0,
                cpu: aiBrain?.monit?.cpu || 0,
                uptime: aiBrain?.pm2_env?.pm_uptime || null
            };
        } catch {
            statuses.aiBrain = { status: 'unknown', active: false };
        }

        // Get pending SIP accounts count
        try {
            const { count } = await supabase
                .from('sip_accounts')
                .select('*', { count: 'exact', head: true })
                .eq('is_synced_to_asterisk', false);
            statuses.pendingSIPSync = count || 0;
        } catch {
            statuses.pendingSIPSync = 0;
        }

        res.json({ success: true, statuses });
    } catch (error: any) {
        logger.error('Error getting service status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Restart Asterisk
router.post('/asterisk/restart', async (req, res) => {
    try {
        logger.info('Restarting Asterisk service...');
        await execAsync('sudo systemctl restart asterisk');

        // Wait for it to come back up
        await new Promise(resolve => setTimeout(resolve, 3000));

        const { stdout } = await execAsync('sudo systemctl is-active asterisk');
        const isActive = stdout.trim() === 'active';

        logger.info(`Asterisk restart ${isActive ? 'successful' : 'failed'}`);
        res.json({ success: isActive, message: isActive ? 'Asterisk restarted successfully' : 'Asterisk restart failed' });
    } catch (error: any) {
        logger.error('Error restarting Asterisk:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reload Asterisk PJSIP
router.post('/asterisk/reload-pjsip', async (req, res) => {
    try {
        logger.info('Reloading Asterisk PJSIP...');
        await execAsync('sudo asterisk -rx "pjsip reload"');
        res.json({ success: true, message: 'PJSIP reloaded successfully' });
    } catch (error: any) {
        logger.error('Error reloading PJSIP:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Restart AI Brain
router.post('/ai-brain/restart', async (req, res) => {
    try {
        logger.info('Restarting AI Brain service...');
        await execAsync('pm2 restart ai-brain');

        // Wait for restart
        await new Promise(resolve => setTimeout(resolve, 2000));

        res.json({ success: true, message: 'AI Brain restarted successfully' });
    } catch (error: any) {
        logger.error('Error restarting AI Brain:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Sync SIP accounts to Asterisk
router.post('/sip/sync', async (req, res) => {
    try {
        logger.info('Syncing SIP accounts to Asterisk...');

        // Get all unsynced SIP accounts
        const { data: accounts, error } = await supabase
            .from('sip_accounts')
            .select('*')
            .eq('is_synced_to_asterisk', false)
            .eq('is_active', true);

        if (error) throw error;

        if (!accounts || accounts.length === 0) {
            return res.json({ success: true, message: 'No accounts to sync', synced: 0 });
        }

        let synced = 0;
        const pjsipWizardPath = '/etc/asterisk/pjsip_wizard.conf';

        for (const account of accounts) {
            try {
                // Generate PJSIP wizard config for this account
                const wizardConfig = `
[${account.sip_username}]
type = wizard
transport = transport-udp
accepts_auth = yes
accepts_registrations = yes
inbound_auth/username = ${account.sip_username}
inbound_auth/password = ${account.sip_password}
endpoint/context = from-internal
endpoint/allow = ulaw,alaw,opus,g722
aor/max_contacts = 5
`;

                // Append to pjsip_wizard.conf
                await execAsync(`echo '${wizardConfig}' | sudo tee -a ${pjsipWizardPath}`);

                // Update database
                await supabase
                    .from('sip_accounts')
                    .update({
                        is_synced_to_asterisk: true,
                        last_sync_at: new Date().toISOString()
                    })
                    .eq('id', account.id);

                synced++;
                logger.info(`Synced SIP account: ${account.sip_username}`);
            } catch (accountError: any) {
                logger.error(`Failed to sync account ${account.sip_username}:`, accountError);
            }
        }

        // Reload PJSIP if we synced any accounts
        if (synced > 0) {
            await execAsync('sudo asterisk -rx "pjsip reload"');
        }

        res.json({
            success: true,
            message: `Synced ${synced} of ${accounts.length} accounts`,
            synced,
            total: accounts.length
        });
    } catch (error: any) {
        logger.error('Error syncing SIP accounts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get SIP endpoint status from Asterisk
router.get('/sip/endpoints', async (req, res) => {
    try {
        const { stdout } = await execAsync('sudo asterisk -rx "pjsip show endpoints"');
        res.json({ success: true, output: stdout });
    } catch (error: any) {
        logger.error('Error getting SIP endpoints:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
