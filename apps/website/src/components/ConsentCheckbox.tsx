import { UseFormRegister } from 'react-hook-form';

type ConsentCheckboxProps = {
    register: UseFormRegister<any>;
    error?: string;
};

function ConsentCheckbox({ register, error }: ConsentCheckboxProps) {
    return (
        <div className="consent-section">
            <label className="checkbox-wrapper">
                <input
                    type="checkbox"
                    className="checkbox-input"
                    {...register('consent')}
                />
                <span className="checkbox-label">
                    I agree to receive an AI-powered phone call at the number provided. I understand
                    that this call will be recorded for quality assurance and that I can opt-out at
                    any time. I have read and agree to the{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                    </a>
                    .
                </span>
            </label>
            {error && <p className="form-error consent-error">{error}</p>}

            <style>{`
        .consent-section {
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          padding: 1rem;
        }
        
        .consent-section a {
          color: var(--color-primary-light);
          text-decoration: underline;
        }
        
        .consent-section a:hover {
          color: var(--color-primary);
        }
        
        .consent-error {
          margin-top: 0.75rem;
        }
      `}</style>
        </div>
    );
}

export default ConsentCheckbox;
