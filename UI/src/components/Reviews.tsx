import { useState, useEffect } from 'react';
import { fetchApprovedReviews, submitReview, ReviewModel, fetchCategories, Category } from '@/lib/api';

export const Reviews = () => {
  const [reviews, setReviews] = useState<ReviewModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', rating: 5, comment: '', service: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [revs, cats] = await Promise.all([
          fetchApprovedReviews(),
          fetchCategories()
        ]);
        setReviews(revs);
        setCategories(cats);
        if (cats.length > 0) {
          setForm(f => ({ ...f, service: cats[0].name }));
        } else {
          setForm(f => ({ ...f, service: 'General Construction' }));
        }
      } catch (err) {
        console.error('Failed to load reviews data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.comment || !form.service) {
      setStatusMsg({ kind: 'error', text: 'All fields are required.' });
      return;
    }
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      await submitReview(form);
      setStatusMsg({ kind: 'success', text: 'Review submitted successfully! It will appear once approved.' });
      setForm(f => ({ ...f, name: '', comment: '', rating: 5 }));
      setTimeout(() => {
        setIsModalOpen(false);
        setStatusMsg(null);
      }, 3000);
    } catch (err: any) {
      setStatusMsg({ kind: 'error', text: err.message || 'Failed to submit review' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-6 flex justify-center">
          <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-32 bg-muted/30 relative" id="reviews">
      <div className="container mx-auto px-6">
        <div className="mb-12 md:mb-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            Client Success
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">What Our Clients Say</h2>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-full bg-foreground text-background font-bold text-sm tracking-wide hover:bg-foreground/90 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-foreground/20"
          >
            Leave a Review
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center text-muted-foreground font-body">
            No reviews yet. Be the first to share your experience!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div key={rev._id} className="bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="absolute top-8 right-8 text-primary/10 group-hover:text-primary/20 transition-colors">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                </div>
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < rev.rating ? 'fill-current' : 'text-muted-foreground/20 fill-transparent'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  ))}
                </div>
                <p className="font-body text-base text-foreground leading-relaxed italic mb-6 relative z-10">"{rev.comment}"</p>
                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-foreground font-display text-lg">{rev.name}</h4>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">{rev.service}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-primary/5">
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">Share Your Experience</h3>
                <p className="text-xs text-muted-foreground mt-1 font-body">We value your feedback!</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {statusMsg && (
                <div className={`p-4 rounded-xl text-sm font-bold ${statusMsg.kind === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {statusMsg.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Your Name</label>
                  <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body text-sm" placeholder="John Doe" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Service Received</label>
                  <select required value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body text-sm">
                    {categories.length > 0 ? categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>) : <option value="General Construction">General Construction</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button type="button" key={star} onClick={() => setForm(f => ({ ...f, rating: star }))} className="focus:outline-none hover:scale-110 transition-transform">
                        <svg className={`w-8 h-8 ${star <= form.rating ? 'text-amber-400 fill-current' : 'text-muted-foreground/30 fill-transparent'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Review Comment</label>
                  <textarea required rows={4} value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body text-sm resize-none" placeholder="Tell us about your experience..." />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm tracking-wide hover:bg-primary/90 transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20">
                  {isSubmitting ? <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
