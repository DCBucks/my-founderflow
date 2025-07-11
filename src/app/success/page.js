'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // You can verify the session here if needed
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {isLoading ? (
          <div>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              color: 'white',
              fontSize: '2rem'
            }}>
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <h1 style={{ color: '#18191c', marginBottom: '1rem' }}>Processing...</h1>
            <p style={{ color: '#666' }}>Setting up your premium account</p>
          </div>
        ) : (
          <div>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              color: 'white',
              fontSize: '2rem'
            }}>
              <i className="fas fa-check"></i>
            </div>
            <h1 style={{ color: '#18191c', marginBottom: '1rem' }}>Welcome to Premium!</h1>
            <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>
              Your subscription has been activated successfully. You now have access to all premium features!
            </p>
            
            <div style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <h3 style={{ color: '#18191c', marginBottom: '1rem' }}>What's Next?</h3>
              <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
                <li>Explore advanced analytics and insights</li>
                <li>Set up smart notifications</li>
                <li>Customize your experience</li>
                <li>Export your data and reports</li>
              </ul>
            </div>

            <Link href="/" style={{
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '9999px',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}>
              <i className="fas fa-rocket" style={{ marginRight: '0.5rem' }}></i>
              Start Using Premium Features
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            color: 'white',
            fontSize: '2rem'
          }}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <h1 style={{ color: '#18191c' }}>Loading...</h1>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
} 