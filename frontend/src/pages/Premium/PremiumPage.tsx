import React, { useEffect, useState } from 'react';
import PricingTable from './PricingTable';
import { Crown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

const PremiumPage = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            // İsteğe bağlı: login'e yönlendir
            // navigate('/login');
            return;
        }
        try {
            // JWT decode simple
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            setUserId(payload.userId || payload._id || payload.id);
        } catch (e) {
            console.error(e);
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Crown size={32} className="text-white" />
                </div>
                <h1 className="text-4xl font-bold mb-4 text-gray-900">Premium'a Yükselt</h1>
                <p className="text-lg text-gray-600">
                    Sınırsız özelliklere erişin, özel rozetler kazanın ve topluluğun en seçkin üyeleri arasına katılın.
                </p>
            </div>

            <PricingTable userId={userId} />

            <div className="mt-12 text-center text-gray-400 text-sm">
                <p>Ödemeler Stripe güvencesiyle işlenir. İstediğiniz zaman iptal edebilirsiniz.</p>
                <Button variant="link" onClick={() => navigate(-1)} className="mt-4">
                    Geri Dön
                </Button>
            </div>
        </div>
    );
};

export default PremiumPage;
