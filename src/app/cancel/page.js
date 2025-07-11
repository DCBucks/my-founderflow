'use client';

import Link from 'next/link';

export default function CancelPage() {
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
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          color: '#6b7280',
          fontSize: '2rem'
        }}>
          <i className="fas fa-times"></i>
        </div>
        
        <h1 style={{ color: '#18191c', marginBottom: '1rem' }}>Subscription Cancelled</h1>
        <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>
          No worries! You can upgrade to premium anytime. Your free account is still active with all basic features.
        </p>
        
        <div style={{
          background: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#18191c', marginBottom: '1rem' }}>Free Features Available:</h3>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>Basic habit tracking</li>
            <li>Daily motivational quotes</li>
            <li>Calendar view</li>
            <li>Basic analytics</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            background: '#6b7280',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '9999px',
            textDecoration: 'none',
            fontWeight: '600',
            display: 'inline-block',
            transition: 'all 0.3s ease'
          }}>
            <i className="fas fa-home" style={{ marginRight: '0.5rem' }}></i>
            Back to Dashboard
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '9999px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <i className="fas fa-crown" style={{ marginRight: '0.5rem' }}></i>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
} 