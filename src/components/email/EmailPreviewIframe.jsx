export default function EmailPreviewIframe({ html }) {
  return (
    <iframe
      srcDoc={html}
      style={{
        width: '100%',
        minHeight: '800px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: '#fff'
      }}
      onLoad={(e) => {
        const iframe = e.target;
        if (iframe.contentWindow?.document?.body) {
          iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
        }
      }}
    />
  );
}