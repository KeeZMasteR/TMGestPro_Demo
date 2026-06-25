import React from 'react';
import { Building2, User } from 'lucide-react';

/**
 * EmailPreviewPanel — Gmail-style preview
 * Renderiza HTML com dangerouslySetInnerHTML (estilos 100% inline, sem Tailwind).
 */
export default function EmailPreviewPanel({ html, from, to, subject }) {
  return (
    <div>
      {/* Gmail chrome */}
      <div style={{
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}>
        {/* Title bar dots */}
        <div style={{
          backgroundColor: '#f6f8fc',
          borderBottom: '1px solid #e8eaed',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f28b82' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#fdd663' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#81c995' }} />
          <span style={{ marginLeft: 10, fontSize: 12, color: '#888', fontFamily: 'Arial, sans-serif' }}>
            Email Preview
          </span>
        </div>

        {/* Subject */}
        <div style={{
          borderBottom: '1px solid #e8eaed',
          padding: '14px 20px',
          backgroundColor: '#ffffff',
        }}>
          <p style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: '#202124',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}>
            {subject || '—'}
          </p>
        </div>

        {/* From / To */}
        <div style={{
          borderBottom: '1px solid #f1f3f4',
          padding: '10px 20px',
          backgroundColor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5f6368', fontFamily: 'Arial, sans-serif' }}>
            <span style={{ color: '#9aa0a6', width: 30, flexShrink: 0 }}>De:</span>
            <span style={{ fontWeight: 500, color: '#202124' }}>{from || '—'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5f6368', fontFamily: 'Arial, sans-serif' }}>
            <span style={{ color: '#9aa0a6', width: 30, flexShrink: 0 }}>Para:</span>
            <span style={{ fontWeight: 500, color: '#202124' }}>{to || '—'}</span>
          </div>
        </div>

        {/* Email body — dangerouslySetInnerHTML, estilos inline fixos */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '8px 0',
          maxWidth: '700px',
          margin: '0 auto',
        }}>
          <div id="email-preview" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>

      <p style={{
        textAlign: 'center',
        fontSize: 11,
        color: '#9aa0a6',
        marginTop: 10,
        fontFamily: 'Arial, sans-serif',
      }}>
        Template fixo — o preview reflecte exactamente o email que será recebido.
      </p>
    </div>
  );
}