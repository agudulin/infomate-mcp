'use client';

import { useState, useEffect } from 'react';
import ASCIIText from '@/components/ASCIIText';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const mcpAddress = 'https://infomate.online/mcp';

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);

    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mcpAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000'
    }}>
      <div style={{ flex: 1, width: '100%', position: 'relative' }}>
        <ASCIIText
          text="infomate"
          asciiFontSize={isMobile ? 3 : 5}
          textFontSize={isMobile ? 50 : 140}
          planeBaseHeight={isMobile ? 4 : 7}
          enableWaves={false}
        />
      </div>

      <div style={{
        paddingBottom: '4rem',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          onClick={handleCopy}
          style={{
            fontFamily: 'monospace',
            fontSize: isMobile ? '12px' : '14px',
            padding: isMobile ? '8px 16px' : '12px 24px',
            background: copied ? '#10b981' : '#000',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {copied ? '✓ Copied!' : 'Copy MCP Address'}
        </button>
        <code style={{
          fontFamily: 'monospace',
          fontSize: isMobile ? '10px' : '12px',
          color: '#888',
          textAlign: 'center',
          wordBreak: 'break-all',
          maxWidth: isMobile ? '90vw' : '600px'
        }}>
          {mcpAddress}
        </code>
      </div>
    </div>
  );
}
