import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// --- Types & Config ---

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

// Updated Product Lineup to match User's Uploaded Visuals
const PRODUCTS: Product[] = [
  { 
    id: 1, 
    name: "REBEL JERSEY 99", 
    price: 85, 
    category: "Tops", 
    image: "https://images.unsplash.com/photo-1577460551100-907ba84418ce?q=80&w=1000&auto=format&fit=crop" // Simulating the Black/Green Jersey
  },
  { 
    id: 2, 
    name: "GLITCH MESH SHORTS", 
    price: 55, 
    category: "Bottoms", 
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1000&auto=format&fit=crop" // Simulating the Mesh Shorts
  },
  { 
    id: 3, 
    name: "ANARCHY COMBAT BOOTS", 
    price: 180, 
    category: "Footwear", 
    image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1000&auto=format&fit=crop" // Simulating the Combat Boots
  },
  { 
    id: 4, 
    name: "GRAFFITI DENIM VEST", 
    price: 150, 
    category: "Outerwear", 
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop" // Simulating the Vest
  },
  { 
    id: 5, 
    name: "SPLATTER HOODIE", 
    price: 110, 
    category: "Outerwear", 
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop" // Simulating the Hoodie
  },
  { 
    id: 6, 
    name: "NEON HIGH-TOPS", 
    price: 130, 
    category: "Footwear", 
    image: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?q=80&w=1000&auto=format&fit=crop" // Simulating the Sneakers
  },
];

// Lookbook images matching the "Lifestyle" uploads (Cars, Models, Urban)
const LOOKBOOK_IMAGES = [
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop", // Car lifestyle
  "https://images.unsplash.com/photo-1614165936126-2ed18e471b10?q=80&w=1000&auto=format&fit=crop", // Dark gritty portrait
  "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=1000&auto=format&fit=crop", // Urban group
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop", // Person sitting on car vibe
];

const API_KEY = process.env.API_KEY || "";

// --- Components ---

/**
 * Custom SVG Logo to simulate the "dripping, distorted, fibrous" look
 * described in the brand identity without needing an external image file.
 */
const RebelLogo = () => (
  <div style={{ position: 'relative', display: 'inline-block' }}>
    <svg width="0" height="0">
      <defs>
        <filter id="slime-drip">
          {/* Turbulence creates the random noise/texture */}
          <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="turbulence" />
          {/* Displacement Map uses the turbulence to distort the text */}
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="5" xChannelSelector="R" yChannelSelector="G" />
          {/* Gaussian Blur softens edges to look like liquid */}
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
        <filter id="glow-neon">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#39FF14" />
        </filter>
      </defs>
    </svg>
    <h1 style={{ 
      fontFamily: 'var(--font-logo)', 
      fontSize: '2.8rem', 
      color: 'var(--color-neon)', 
      margin: 0,
      filter: 'url(#slime-drip) url(#glow-neon)',
      letterSpacing: '2px',
      transform: 'scaleY(1.2)', // Elongated text
      cursor: 'pointer'
    }}>
      REBEL YOUTH
    </h1>
  </div>
);

const Navbar = ({ cartCount, toggleChat }: { cartCount: number, toggleChat: () => void }) => {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.5rem 3rem',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid #1a1a1a'
    }}>
      <RebelLogo />
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <button 
          onClick={toggleChat}
          style={{
            background: 'rgba(57, 255, 20, 0.05)',
            border: '1px solid var(--color-neon)',
            color: 'var(--color-neon)',
            padding: '0.6rem 1.2rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
            clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' // Cyberpunk shape
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-neon)';
            e.currentTarget.style.color = 'var(--color-black)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(57, 255, 20, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(57, 255, 20, 0.05)';
            e.currentTarget.style.color = 'var(--color-neon)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          [ AI STYLIST ]
        </button>
        <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--color-white)', fontFamily: 'var(--font-display)' }}>CART</span>
          {cartCount > 0 && (
            <span style={{
              background: 'var(--color-neon)',
              color: 'var(--color-black)',
              fontWeight: '900',
              borderRadius: '2px',
              padding: '2px 6px',
              fontSize: '0.8rem',
              boxShadow: '0 0 10px var(--color-neon)'
            }}>
              {cartCount}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
};

const Hero = () => (
  <header style={{
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderBottom: '2px solid var(--color-neon)'
  }}>
    {/* Real Background Image - Urban Car Scene */}
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: 'url(https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2000&auto=format&fit=crop)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: 'grayscale(100%) contrast(1.1) brightness(0.4)', // Dark & Gritty processing
      zIndex: -2
    }}></div>
    
    {/* Green tint overlay */}
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(5,5,5,1) 100%)',
      zIndex: -1
    }}></div>
    
    <h2 style={{
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(4rem, 12vw, 9rem)',
      color: 'var(--color-white)',
      margin: 0,
      textAlign: 'center',
      lineHeight: 0.85,
      textTransform: 'uppercase',
      letterSpacing: '-4px',
      position: 'relative',
      zIndex: 1,
      mixBlendMode: 'difference'
    }}>
      CHAOS<br/>
      <span style={{ 
        color: 'var(--color-neon)', 
        textShadow: '0 0 30px rgba(57,255,20,0.6), 4px 4px 0px #000' 
      }}>YOUTH</span>
    </h2>
    
    <p style={{
      marginTop: '2rem',
      maxWidth: '600px',
      textAlign: 'center',
      fontSize: '1.4rem',
      lineHeight: '1.4',
      borderLeft: '4px solid var(--color-neon)',
      paddingLeft: '1.5rem',
      background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
      backdropFilter: 'blur(5px)',
      padding: '1rem',
      transform: 'skewX(-10deg)'
    }}>
      <span style={{ display: 'block', transform: 'skewX(10deg)' }}>
        WEAR YOUR REBELLION.
      </span>
    </p>
    
    <button style={{
      marginTop: '4rem',
      padding: '1.2rem 4rem',
      background: 'transparent',
      color: 'var(--color-white)',
      border: '2px solid var(--color-white)',
      fontFamily: 'var(--font-mono)',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--color-neon)';
      e.currentTarget.style.borderColor = 'var(--color-neon)';
      e.currentTarget.style.color = 'var(--color-black)';
      e.currentTarget.style.boxShadow = '0 0 40px var(--color-neon)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.borderColor = 'var(--color-white)';
      e.currentTarget.style.color = 'var(--color-white)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      ENTER THE VOID
    </button>
  </header>
);

const Lookbook = () => (
  <section style={{ padding: '4rem 0', background: '#0a0a0a', borderBottom: '1px solid #222' }}>
     <div style={{ padding: '0 5%', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', margin: 0, color: '#fff' }}>CAMPAIGN // 2024</h3>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-neon)' }}>SCROLL >>></span>
     </div>
     <div style={{
       display: 'flex',
       gap: '1rem',
       overflowX: 'auto',
       padding: '0 5% 2rem 5%',
       scrollSnapType: 'x mandatory'
     }}>
       {LOOKBOOK_IMAGES.map((img, i) => (
         <div key={i} style={{
           minWidth: '400px',
           height: '500px',
           backgroundImage: `url(${img})`,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           scrollSnapAlign: 'center',
           border: '1px solid #333',
           position: 'relative',
           filter: 'grayscale(100%)',
           transition: 'filter 0.3s'
         }}
         onMouseEnter={(e) => e.currentTarget.style.filter = 'grayscale(0%)'}
         onMouseLeave={(e) => e.currentTarget.style.filter = 'grayscale(100%)'}
         >
           <div style={{
             position: 'absolute',
             bottom: '1rem',
             left: '1rem',
             background: '#000',
             color: 'var(--color-neon)',
             padding: '0.2rem 0.5rem',
             fontFamily: 'var(--font-mono)',
             fontSize: '0.8rem'
           }}>
             IMG_00{i+1}.RAW
           </div>
         </div>
       ))}
     </div>
  </section>
);

const ProductCard: React.FC<{ product: Product, addToCart: (p: Product) => void }> = ({ product, addToCart }) => {
  const [hover, setHover] = useState(false);

  return (
    <div 
      style={{
        border: '1px solid #1a1a1a',
        padding: '0',
        position: 'relative',
        transition: 'all 0.3s ease',
        borderColor: hover ? 'var(--color-neon)' : '#1a1a1a',
        background: '#050505',
        transform: hover ? 'translateY(-5px)' : 'none',
        boxShadow: hover ? '0 10px 30px -10px rgba(57, 255, 20, 0.2)' : 'none'
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Image Container */}
      <div style={{
        width: '100%',
        aspectRatio: '1/1',
        overflow: 'hidden',
        position: 'relative',
        background: '#111'
      }}>
        <img 
          src={product.image} 
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease, filter 0.3s',
            transform: hover ? 'scale(1.1)' : 'scale(1)',
            filter: hover ? 'contrast(1.2)' : 'grayscale(100%) contrast(1.2)'
          }}
        />
        
        {/* Category Tag */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          padding: '4px 8px',
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          border: '1px solid #333'
        }}>
          {product.category}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.1rem', 
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            lineHeight: 1.4,
            maxWidth: '70%'
          }}>
            {product.name}
          </h3>
          <span style={{ 
            color: 'var(--color-neon)', 
            fontWeight: 'bold', 
            fontFamily: 'var(--font-mono)',
            fontSize: '1.1rem' 
          }}>
            ${product.price}
          </span>
        </div>

        <button 
          onClick={() => addToCart(product)}
          style={{
            width: '100%',
            padding: '1rem',
            background: hover ? 'var(--color-neon)' : 'transparent',
            color: hover ? 'var(--color-black)' : 'var(--color-white)',
            border: '1px solid',
            borderColor: hover ? 'var(--color-neon)' : '#333',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1px',
            fontSize: '0.9rem',
            transition: 'all 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{hover ? 'Add to Cart' : 'View Item'}</span>
          <span>+</span>
        </button>
      </div>
    </div>
  );
};

const AIChat = ({ onClose }: { onClose: () => void }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: "SYSTEM ONLINE. I see you looking at the Anarchy Boots. Need a fit check?" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !API_KEY) return;
    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      // Using gemini-3-flash-preview as per instructions for text tasks
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
            systemInstruction: "You are the AI stylist for Rebel Youth Collective. Your vibe is rude, helpful, and extremely punk. You love black, neon green, and distressed clothing. You specifically know about these products: 'Rebel Jersey 99', 'Glitch Mesh Shorts', 'Anarchy Combat Boots', 'Graffiti Denim Vest', 'Splatter Hoodie'. If someone asks for a look, recommend one of these specific items.",
            temperature: 0.9,
        }
      });
      
      const text = response.text || "Static in the line. Try again.";
      setMessages(prev => [...prev, { sender: 'ai', text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'ai', text: "ERROR: NEURAL LINK SEVERED." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      height: '600px',
      background: 'rgba(5, 5, 5, 0.95)',
      border: '1px solid var(--color-neon)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 0 50px rgba(57, 255, 20, 0.1)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--color-neon)',
        color: '#000'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '10px', height: '10px', background: '#000', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
          <h4 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '1px', fontSize: '1.2rem' }}>REBEL_NET</h4>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold', lineHeight: 1 }}>&times;</button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '1.5rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.9rem'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '1rem',
            background: msg.sender === 'user' ? '#1a1a1a' : 'rgba(57, 255, 20, 0.05)',
            border: msg.sender === 'ai' ? '1px solid var(--color-neon)' : '1px solid #333',
            color: msg.sender === 'ai' ? 'var(--color-neon)' : '#fff',
            position: 'relative',
            clipPath: msg.sender === 'ai' 
              ? 'polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%)'
              : 'polygon(0 0, 100% 0, 100% 100%, 10% 100%, 0 90%)'
          }}>
            {msg.sender === 'ai' && (
               <span style={{ 
                 position: 'absolute', 
                 top: '-8px', 
                 left: '10px', 
                 fontSize: '0.6rem', 
                 background: '#000', 
                 padding: '0 6px',
                 border: '1px solid var(--color-neon)',
                 color: 'var(--color-neon)'
               }}>STYLIST.EXE</span>
            )}
            {msg.text}
          </div>
        ))}
        {loading && <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic' }}>Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid #333',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask for advice..."
          style={{
            flex: 1,
            background: '#000',
            border: '1px solid #333',
            color: '#fff',
            padding: '0.8rem',
            fontFamily: 'var(--font-mono)',
            outline: 'none'
          }}
        />
        <button 
          onClick={handleSend}
          style={{
            background: 'var(--color-white)',
            border: 'none',
            cursor: 'pointer',
            padding: '0 1.5rem',
            fontWeight: 'bold',
            fontFamily: 'var(--font-mono)'
          }}
        >
          SEND
        </button>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer style={{
    padding: '6rem 2rem',
    borderTop: '1px solid #222',
    textAlign: 'center',
    color: '#666',
    background: '#000'
  }}>
    <h2 style={{ fontFamily: 'var(--font-logo)', color: '#1a1a1a', fontSize: '6rem', margin: '0 0 2rem 0', lineHeight: 0.8 }}>REBEL YOUTH</h2>
    <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
      <a href="#" style={{ color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-mono)', borderBottom: '1px solid transparent' }}>INSTAGRAM</a>
      <a href="#" style={{ color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-mono)', borderBottom: '1px solid transparent' }}>TIKTOK</a>
      <a href="#" style={{ color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-mono)', borderBottom: '1px solid transparent' }}>MANIFESTO</a>
      <a href="#" style={{ color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-mono)', borderBottom: '1px solid transparent' }}>LEGAL</a>
    </div>
    <p style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
      © 2024 REBEL YOUTH COLLECTIVE. ESTABLISHED IN CHAOS.<br/>
      ALL RIGHTS RESERVED. DO NOT CONFORM.
    </p>
  </footer>
);

// --- Main App ---

const App = () => {
  const [cart, setCart] = useState<Product[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
    // Glitch effect on body
    const originalFilter = document.body.style.filter;
    document.body.style.filter = 'invert(1)';
    setTimeout(() => {
        document.body.style.filter = originalFilter;
    }, 50);
  };

  return (
    <>
      <Navbar cartCount={cart.length} toggleChat={() => setChatOpen(!chatOpen)} />
      
      <Hero />
      
      <Lookbook />

      <main style={{ padding: '6rem 5%', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end', 
          marginBottom: '4rem',
          borderBottom: '1px solid #222',
          paddingBottom: '1rem'
        }}>
          <div>
            <span style={{ color: 'var(--color-neon)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>01 // COLLECTION</span>
            <h2 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '4rem', 
              margin: 0,
              textTransform: 'uppercase',
              lineHeight: 0.9,
              marginTop: '0.5rem'
            }}>
              LATEST DROPS
            </h2>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', color: '#666', textAlign: 'right' }}>
            [ {PRODUCTS.length} ITEMS DETECTED ]<br/>
            [ SECURE CONNECTION ]
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '3rem 2rem' 
        }}>
          {PRODUCTS.map(product => (
            <ProductCard key={product.id} product={product} addToCart={addToCart} />
          ))}
        </div>
      </main>

      <div style={{
        background: 'var(--color-neon)',
        color: 'var(--color-black)',
        padding: '6rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
         <div style={{
           position: 'absolute',
           top: '-50%',
           left: '-50%',
           width: '200%',
           height: '200%',
           background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\' fill=\'%23000000\' fill-opacity=\'0.1\'/%3E%3C/svg%3E")',
           transform: 'rotate(30deg)'
         }}></div>
         
         <div style={{ position: 'relative', zIndex: 1 }}>
           <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '5rem', margin: '0 0 1rem 0', lineHeight: 0.8 }}>JOIN THE CULT</h3>
           <p style={{ maxWidth: '600px', margin: '0 auto 3rem auto', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '1.2rem' }}>
             Get exclusive drops, secret links, and pure chaos delivered to your inbox.
           </p>
           <div style={{ display: 'flex', justifyContent: 'center', gap: '0', maxWidth: '500px', margin: '0 auto' }}>
             <input type="email" placeholder="ENTER_EMAIL_ADDRESS" style={{ 
               flex: 1, 
               padding: '1.2rem', 
               background: '#000', 
               border: '2px solid #000', 
               color: 'var(--color-neon)',
               fontFamily: 'var(--font-mono)',
               fontSize: '1rem',
               outline: 'none'
              }} />
             <button style={{ 
               padding: '1.2rem 3rem', 
               background: '#fff', 
               color: '#000', 
               border: '2px solid #000',
               borderLeft: 'none', 
               fontWeight: 'bold',
               cursor: 'pointer',
               fontFamily: 'var(--font-mono)',
               textTransform: 'uppercase'
              }}>SUBMIT</button>
           </div>
         </div>
      </div>

      <Footer />

      {chatOpen && <AIChat onClose={() => setChatOpen(false)} />}
    </>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);