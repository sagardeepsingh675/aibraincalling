import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { submitLead } from '../lib/supabase';
import ConsentCheckbox from './ConsentCheckbox';

const leadSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z
        .string()
        .min(10, 'Phone number must be at least 10 digits')
        .regex(/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    consent: z.boolean().refine((val) => val === true, {
        message: 'You must agree to receive a call',
    }),
});

type LeadFormData = z.infer<typeof leadSchema>;

function LeadForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LeadFormData>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            consent: false,
        },
    });

    const onSubmit = async (data: LeadFormData) => {
        setIsSubmitting(true);
        setSubmitError(null);

        const result = await submitLead({
            name: data.name,
            phone: data.phone,
            email: data.email,
        });

        setIsSubmitting(false);

        if (result.success) {
            navigate('/thank-you');
        } else {
            setSubmitError(result.error || 'Something went wrong. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="lead-form card">
            <h2 className="form-title">Get Your Free AI Consultation Call</h2>
            <p className="form-subtitle">
                Fill in your details and our AI assistant will call you within minutes
            </p>

            <div className="form-group">
                <label htmlFor="name" className="form-label">
                    Your Name *
                </label>
                <input
                    type="text"
                    id="name"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="Enter your full name"
                    {...register('name')}
                />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div className="form-group">
                <label htmlFor="phone" className="form-label">
                    Phone Number *
                </label>
                <input
                    type="tel"
                    id="phone"
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    placeholder="10-digit mobile number"
                    {...register('phone')}
                />
                {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>

            <div className="form-group">
                <label htmlFor="email" className="form-label">
                    Email (Optional)
                </label>
                <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="your@email.com"
                    {...register('email')}
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="form-group">
                <ConsentCheckbox register={register} error={errors.consent?.message} />
            </div>

            {submitError && (
                <div className="submit-error">
                    <p>{submitError}</p>
                </div>
            )}

            <button type="submit" className="btn btn-primary submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <span className="spinner"></span>
                        Submitting...
                    </>
                ) : (
                    <>
                        <span>📞</span>
                        Request Call Now
                    </>
                )}
            </button>

            <style>{`
        .lead-form {
          max-width: 480px;
          margin: 0 auto;
        }
        
        .form-title {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .form-subtitle {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
        
        .form-input.error {
          border-color: #ef4444;
        }
        
        .submit-btn {
          width: 100%;
          margin-top: 1rem;
          font-size: 1.125rem;
          padding: 1rem 2rem;
        }
        
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .submit-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: 8px;
          padding: 1rem;
          color: #ef4444;
          margin-bottom: 1rem;
        }
        
        .spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </form>
    );
}

export default LeadForm;
