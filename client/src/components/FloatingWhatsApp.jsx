const WHATSAPP_URL = 'https://wa.me/917837552084?text=Hi%2C%20I%20have%20a%20query%20about%20LegacyWealth%20courses.';

function FloatingWhatsApp() {
  return (
    <>
      <style>{`
        @keyframes whatsapp-pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.6); }
          70% { box-shadow: 0 0 0 14px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
        .whatsapp-float-btn {
          position: fixed;
          right: 20px;
          bottom: 80px;
          width: 56px;
          height: 56px;
          background-color: #25D366;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: whatsapp-pulse 2s infinite;
          transition: transform 0.2s;
        }
        .whatsapp-float-btn:hover {
          transform: scale(1.1);
        }
      `}</style>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float-btn"
        aria-label="Chat with us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.882l6.213-1.449A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.99-1.367l-.358-.213-3.688.861.937-3.588-.233-.368A9.818 9.818 0 012.18 12C2.18 6.57 6.57 2.18 12 2.18c5.43 0 9.818 4.39 9.818 9.82 0 5.43-4.388 9.818-9.818 9.818z"/>
        </svg>
      </a>
    </>
  );
}

export default FloatingWhatsApp;
