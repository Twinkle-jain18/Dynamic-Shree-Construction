import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Award, MessageCircle, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { MapEmbed } from './MapEmbed';
import emailjs from '@emailjs/browser';

interface ContactProps {
  initialMessage?: string;
  initialService?: string;
}

export function Contact({ initialMessage, initialService }: ContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: initialService || 'Building Construction',
    message: initialMessage || ''
  });

  useEffect(() => {
    if (initialMessage || initialService) {
      setFormData(prev => ({ 
        ...prev, 
        message: initialMessage ?? prev.message,
        service: initialService ?? prev.service
      }));
    }
  }, [initialMessage, initialService]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Enter a valid email address';
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Contact number is required';
    } else if (phoneDigits.length < 8) {
      newErrors.phone = 'Enter a valid number (min 8 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (validate()) {
      setIsSending(true);
      
      try {
        const { submitInquiry } = await import('@/lib/api');

        const submittedAt = new Date().toLocaleString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        // ── 1. Notify Admin ─────────────────────────────────────────
        const adminEmailPromise = emailjs.send(
          'service_82yeeui',
          'template_ick8md5',
          {
            name:     formData.name,
            phone:    formData.phone,
            email:    formData.email,
            service:  formData.service,
            message:  formData.message || 'No message provided',
            time:     submittedAt,
          },
          'U2XfBhAfW67mv6Tvo'
        );

        const adminResult = await adminEmailPromise;
        const emailResult = adminResult;

        // ── 3. Save to Database ─────────────────────────────────────
        await submitInquiry({
          name:    formData.name,
          email:   formData.email,
          phone:   formData.phone,
          service: formData.service,
          message: formData.message
        });

        if (emailResult.status === 200) {
          setIsSubmitted(true);
          setFormData({
            name: '',
            email: '',
            phone: '',
            service: 'Building Construction',
            message: ''
          });
        }
      } catch (error: any) {
        console.error('Submission Error:', error);
        setFormError(error.message || 'Failed to send message. Please try again or contact us directly.');
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <section className="mt-4 mb-6 md:mb-10 relative z-10 w-full" id="contact">
      <div className="container mx-auto px-6">
        <div className="text-center mb-6 md:mb-10 opacity-0 animate-fade-up">
          <h3 className="font-display text-2xl md:text-5xl font-bold text-foreground mb-2 md:mb-3">
            Contact Us
          </h3>
          <p className="font-body text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-normal">
            Ready to bring your vision to life? Get in touch with our founder and expert team to discuss your next construction project.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-10">
          {/* Contact Info Card */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-xl p-4 md:p-8 overflow-hidden relative group opacity-0 animate-fade-up stagger-1 h-full">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
            
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-border/50">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Award className="w-6 h-6 md:w-7 md:h-7 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Founder & CEO</p>
                <h4 className="font-display text-lg md:text-xl font-bold text-foreground tracking-wide line-height-tight">Shivanand J Kannal</h4>
              </div>
            </div>

            <div className="space-y-6">
              {/* Phone */}
              <div className="flex items-start gap-3 group/item cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center group-hover/item:bg-primary group-hover/item:border-primary transition-all duration-300">
                  <Phone className="w-4 h-4 text-muted-foreground group-hover/item:text-white transition-colors" />
                </div>
                <div>
                  <h5 className="font-display text-base font-bold text-foreground mb-1">Call Directly</h5>
                  <div className="flex flex-col gap-0.5">
                    <a href="tel:9620085363" className="font-body text-muted-foreground hover:text-primary transition-colors text-sm">+91 9620085363</a>
                    <a href="tel:9164409666" className="font-body text-muted-foreground hover:text-primary transition-colors text-sm">+91 9164409666</a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3 group/item cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center group-hover/item:bg-primary group-hover/item:border-primary transition-all duration-300">
                  <Mail className="w-4 h-4 text-muted-foreground group-hover/item:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h5 className="font-display text-base font-bold text-foreground mb-1">Send Details</h5>
                  <div className="flex flex-col gap-0.5">
                    <a href="mailto:shivanandkannal@gmail.com" className="font-body text-muted-foreground hover:text-primary transition-colors text-sm break-all">shivanandkannal@gmail.com</a>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-3 group/item cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center group-hover/item:bg-[#25D366] group-hover/item:border-[#25D366] transition-all duration-300">
                  <MessageCircle className="w-4 h-4 text-muted-foreground group-hover/item:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h5 className="font-display text-base font-bold text-foreground mb-1">Chat on WhatsApp</h5>
                  <div className="flex flex-col gap-0.5">
                    <a href="https://wa.me/919620085363" target="_blank" rel="noopener noreferrer" className="font-body text-muted-foreground hover:text-[#25D366] transition-colors text-sm break-all">+91 9620085363</a>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 group/item">
                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center group-hover/item:bg-primary group-hover/item:border-primary transition-all duration-300">
                  <MapPin className="w-4 h-4 text-muted-foreground group-hover/item:text-white transition-colors" />
                </div>
                <div>
                  <h5 className="font-display text-base font-bold text-foreground mb-1">Visit Office</h5>
                  <p className="font-body text-muted-foreground text-xs leading-normal">
                    Double Road, Mahalingpur - 587312<br />
                    Karnataka, India
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="lg:col-span-3 bg-card rounded-xl border border-border shadow-xl p-4 md:p-8 relative group opacity-0 animate-fade-up stagger-2">
            <h4 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Send us a Message</h4>
            
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-6 md:py-10 text-center animate-fade-in">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                  <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-green-500" />
                </div>
                <h5 className="text-lg md:text-xl font-bold text-foreground mb-1">Submitted successfully!</h5>
                <p className="text-xs md:text-sm text-muted-foreground">Thank you for Reaching out. We will get back to you shortly.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 md:mt-6 text-primary font-bold hover:underline text-xs md:text-sm"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {/* Name */}
                  <div className="space-y-1 md:space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold text-foreground ml-1">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter name"
                      className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-background border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-primary'} focus:outline-none focus:ring-2 transition-all outline-none text-xs md:text-sm`}
                    />
                    {errors.name && <p className="text-red-500 text-[9px] md:text-[10px] ml-1 mt-0.5">{errors.name}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1 md:space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold text-foreground ml-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 98765 43210"
                      className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-background border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-primary'} focus:outline-none focus:ring-2 transition-all outline-none text-xs md:text-sm`}
                    />
                    {errors.phone && <p className="text-red-500 text-[9px] md:text-[10px] ml-1 mt-0.5">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {/* Email */}
                  <div className="space-y-1 md:space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold text-foreground ml-1">Email ID *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.actual@email.com"
                      className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-background border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-primary'} focus:outline-none focus:ring-2 transition-all outline-none text-xs md:text-sm`}
                    />
                    {errors.email && <p className="text-red-500 text-[9px] md:text-[10px] ml-1 mt-0.5">{errors.email}</p>}
                  </div>

                  {/* Service */}
                  <div className="space-y-1 md:space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold text-foreground ml-1">Select Service</label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary transition-all outline-none appearance-none cursor-pointer text-xs md:text-sm"
                    >
                      <option>Building Construction</option>
                      <option>Architectural Planning</option>
                      <option>Structural Design</option>
                      <option>2D/3D Elevation Design</option>
                      <option>Building Renovation</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1 md:space-y-1.5">
                  <label className="text-[10px] md:text-xs font-semibold text-foreground ml-1">Your Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe your requirements"
                    rows={3}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary transition-all outline-none resize-none text-xs md:text-sm"
                  />
                </div>
                {formError && (
                  <div className="flex items-center gap-2 p-2.5 md:p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <p className="text-[10px] md:text-xs font-medium">{formError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-3 md:py-4 bg-primary text-white font-bold text-sm md:text-base rounded-xl hover:bg-primary/90 hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2 md:gap-3 group disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Google Map */}
        <div className="max-w-6xl mx-auto">
          <MapEmbed />
        </div>
      </div>
    </section>
  );
}
