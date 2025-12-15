import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Ödemeniz doğrulanıyor...');
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            setMessage('Geçersiz işlem: Session ID bulunamadı.');
            return;
        }

        const verifyPayment = async () => {
            try {
                const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';
                const token = localStorage.getItem('authToken');

                const res = await fetch(`${API_BASE}/api/payment/verify-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ sessionId })
                });

                const data = await res.json();

                if (data.success) {
                    setStatus('success');
                    setMessage('Ödemeniz başarıyla tamamlandı! Artık Premium üyesiniz.');
                    // Force profile refresh by dispatching event or relying on reload (simple approach)
                    window.dispatchEvent(new CustomEvent('profile-updated'));
                    // Or reload the page after a short delay or let user navigate
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Ödeme doğrulanamadı.');
                }
            } catch (error: any) {
                console.error('Doğrulama hatası:', error);
                setStatus('error');
                setMessage('Bir hata oluştu: ' + error.message);
            }
        };

        verifyPayment();
        verifyPayment();
    }, [sessionId]);

    useEffect(() => {
        if (status === 'success') {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        window.location.href = '/home';
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [status]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">İşleminiz Kontrol Ediliyor</h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-600 mb-2">Ödeme Başarılı!</h2>
                        <p className="text-gray-600 mb-2">{message}</p>
                        <p className="text-sm text-gray-400 mb-6">{countdown} saniye içinde yönlendiriliyorsunuz...</p>
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                                // Full reload to ensure all states (like sidebar) are updated
                                window.location.href = '/home';
                            }}
                        >
                            Ana Sayfaya Dön
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-600 mb-2">İşlem Hatası</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <Button
                            className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                            onClick={() => navigate('/premium')}
                        >
                            Tekrar Dene
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
