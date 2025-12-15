import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '../../components/ui/button';
import { Check } from 'lucide-react';

const stripePromise = loadStripe('pk_test_51SebZHRSoHt6M5qf5wykVBPYGPuJphLAafxd82lYNyh89OQigxPEkogHwC4YlVToTgeYkYYpybwsmgXOBbvkFU9600UbuDs2yh');

interface PricingProps {
    userId?: string | null;
}

const PricingTable: React.FC<PricingProps> = ({ userId }) => {
    const [loading, setLoading] = useState<string | null>(null);

    const plans = [
        {
            id: 'monthly',
            name: 'Aylık Premium',
            price: '₺100/ay',
            features: ['Sınırsız Mesaj', 'Özel Odalara Erişim', 'Rozet', 'Reklamsız Deneyim'],
            priceId: 'price_1SecXLRSoHt6M5qfB8aHL7gf'
        },
        {
            id: 'yearly',
            name: 'Yıllık Premium',
            price: '₺1000/yıl',
            features: ['Aylık plandaki her şey', '2 ay bedava', 'Erken özellik erişimi'],
            priceId: 'price_1SecXMRSoHt6M5qfqsshv4Ks'
        }
    ];

    // Kullanıcının Price ID'lerini bilmediğim için dummy ID kullanıyorum.
    // Kullanıcıya bu ID'leri değiştirmesi gerektiğini belirten bir not düşeceğim.

    const handleSubscribe = async (priceId: string) => {
        if (!userId) {
            alert('Lütfen önce giriş yapın');
            return;
        }

        setLoading(priceId);

        try {
            const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_BASE}/api/payment/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    priceId: priceId,
                    userId: userId
                })
            });

            const session = await response.json();

            if (!session.success) {
                throw new Error(session.error || 'Session creation failed');
            }

            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error('No checkout URL received');
            }

        } catch (error: any) {
            console.error('Payment error:', error);
            alert('Ödeme başlatılamadı: ' + error.message);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="grid grid-cols-2 gap-12 max-w-6xl mx-auto p-8">
            {/* Not: Price ID'leri Stripe Dashboard'dan alınıp güncellenmeli */}
            <div className="border bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <h3 className="text-xl font-bold mb-2">Aylık Plan</h3>
                <div className="text-3xl font-bold mb-4">₺100<span className="text-sm font-normal text-gray-500">/ay</span></div>
                <p className="text-gray-500 mb-6">Düzenli premium deneyimi.</p>
                <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> Sınırsız Mesajlaşma</li>
                    <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> Premium Odalar</li>
                    <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> Profil Rozeti</li>
                </ul>
                <br />
                <br />
                <Button
                    onClick={() => handleSubscribe('price_1SecXLRSoHt6M5qfB8aHL7gf')}
                    disabled={!!loading}
                    className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all font-medium text-sm shadow-sm"
                >
                    {loading === 'price_1SecXLRSoHt6M5qfB8aHL7gf' ? 'Yönlendiriliyor...' : 'Abone Ol'}
                </Button>
            </div>

            <div className="border bg-black text-black rounded-2xl p-8 shadow-xl relative overflow-hidden transform scale-105">
                <div className="absolute -top-3 right-4
                bg-gradient-to-r from-purple-500 to-fuchsia-400
                text-white text-[11px] font-bold uppercase
                px-4 py-1 rounded-full shadow-lg">
                    🔥 Popüler
                </div>
                <h3 className="text-xl font-bold mb-2">Yıllık Plan</h3>
                <div className="text-3xl font-bold mb-4">₺1000<span className="text-sm font-normal text-gray-400">/yıl</span></div>
                <p className="text-gray-400 mb-6">2 ay bedava!</p>
                <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2"><Check size={18} className="text-yellow-500" /> Her şey dahil</li>
                    <li className="flex items-center gap-2"><Check size={18} className="text-yellow-500" /> 2 Ay Bedava</li>
                    <li className="flex items-center gap-2"><Check size={18} className="text-yellow-500" /> Erken Erişim</li>
                </ul>
                <br />
                <Button
                    onClick={() => handleSubscribe('price_1SecXMRSoHt6M5qfqsshv4Ks')}
                    disabled={!!loading}
                    className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all font-medium text-sm shadow-sm"
                >
                    {loading === 'price_1SecXMRSoHt6M5qfqsshv4Ks' ? 'Yönlendiriliyor...' : 'Yıllık Abone Ol'}
                </Button>
            </div>
        </div >
    );
};

export default PricingTable;
