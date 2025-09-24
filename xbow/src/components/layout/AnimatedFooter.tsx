import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { Truck, MapPin, Ship, Warehouse, Network, Phone, Mail, MapPin as Location } from 'lucide-react';

export const AnimatedFooter: React.FC = () => {
  const [typewriterText, setTypewriterText] = useState('');
  const [showCEO, setShowCEO] = useState(false);
  const [quoteWords, setQuoteWords] = useState<string[]>([]);
  
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: "-100px" });
  const controls = useAnimation();

  const fullText = "At XBOW Logistics Pvt. Ltd., we believe Network is Net Worth.";
  const quote = "Excellence in logistics is not just about moving goods; it's about moving dreams, aspirations, and the future of businesses forward.";
  const quoteWordsArray = quote.split(' ');

  // Typewriter effect
  useEffect(() => {
    if (isInView) {
      let index = 0;
      const timer = setInterval(() => {
        if (index <= fullText.length) {
          setTypewriterText(fullText.slice(0, index));
          index++;
        } else {
          clearInterval(timer);
          setTimeout(() => setShowCEO(true), 500);
          setTimeout(() => {
            // Start quote animation
            quoteWordsArray.forEach((_, wordIndex) => {
              setTimeout(() => {
                setQuoteWords(prev => [...prev, quoteWordsArray[wordIndex]]);
              }, wordIndex * 150);
            });
          }, 1000);
        }
      }, 50);

      return () => clearInterval(timer);
    }
  }, [isInView]);

  // Parallax controls
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  const floatingIconVariants = {
    animate: {
      y: [0, -10, 0],
      x: [0, 5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  const movingTruckVariants = {
    animate: {
      x: ['-100%', '100vw'],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear" as const
      }
    }
  };

  

  return (
    <footer 
      ref={footerRef}
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 animate-pulse" />
      
      {/* Moving Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] animate-pulse" />
      </div>

      {/* Floating Background Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          variants={floatingIconVariants}
          animate="animate"
          className="absolute top-20 left-10 text-white/10"
          style={{ animationDelay: '0s' }}
        >
          <Truck className="h-16 w-16" />
        </motion.div>
        
        <motion.div
          variants={floatingIconVariants}
          animate="animate"
          className="absolute top-32 right-20 text-white/10"
          style={{ animationDelay: '2s' }}
        >
          <Ship className="h-12 w-12" />
        </motion.div>
        
        <motion.div
          variants={floatingIconVariants}
          animate="animate"
          className="absolute bottom-40 left-1/4 text-white/10"
          style={{ animationDelay: '4s' }}
        >
          <Warehouse className="h-14 w-14" />
        </motion.div>
        
        <motion.div
          variants={floatingIconVariants}
          animate="animate"
          className="absolute top-16 right-1/3 text-white/10"
          style={{ animationDelay: '1s' }}
        >
          <MapPin className="h-10 w-10" />
        </motion.div>

        <motion.div
          variants={floatingIconVariants}
          animate="animate"
          className="absolute bottom-20 right-10 text-white/10"
          style={{ animationDelay: '3s' }}
        >
          <Network className="h-18 w-18" />
        </motion.div>
      </div>

      {/* Moving Truck Animation */}
      <div className="absolute bottom-0 left-0 w-full h-2 overflow-hidden pointer-events-none">
        <motion.div
          variants={movingTruckVariants}
          animate="animate"
          className="absolute bottom-0 text-yellow-400/30"
        >
          <Truck className="h-8 w-8" />
        </motion.div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={controls}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        {/* Main Content */}
        <div className="text-center mb-12">
          {/* Typewriter Text */}
          <motion.div
            variants={itemVariants}
            className="mb-8"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
              {typewriterText}
              <span className="animate-pulse">|</span>
            </h2>
            
            {/* CEO Name Fade In */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showCEO ? 1 : 0, y: showCEO ? 0 : 20 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-lg text-blue-200"
            >
              — Sureshkumar Murugan, CEO
            </motion.div>
          </motion.div>

          {/* Pulsing Tagline */}
          <motion.div
            variants={itemVariants}
            className="mb-12"
          >
            <motion.h3
              animate={{
                scale: [1, 1.05, 1],
                textShadow: [
                  "0 0 10px rgba(59, 130, 246, 0.5)",
                  "0 0 20px rgba(59, 130, 246, 0.8)",
                  "0 0 10px rgba(59, 130, 246, 0.5)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-xl md:text-2xl font-semibold text-yellow-400"
            >
              Build. Learn. Deliver.
            </motion.h3>
          </motion.div>

          {/* Quote Reveal Animation */}
          <motion.div
            variants={itemVariants}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="text-lg md:text-xl text-gray-300 leading-relaxed italic">
              {quoteWords.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="inline-block mr-2"
                >
                  {word}
                </motion.span>
              ))}
            </div>
            
        
          </motion.div>
          
        </div>
        

        {/* Company Information Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {/* Contact Info */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-blue-400" />
              Contact Us
            </h4>
            <div className="space-y-2 text-gray-300">
              <p className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-green-400" />
                +91 9176622222

              </p>
              <p className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-red-400" />
                 Sales: sales@freeleft.in
              </p>
                <p className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-red-400" />
                 Careers: hr@freeleft.in
              </p>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Truck className="h-5 w-5 mr-2 text-yellow-400" />
              Our Services
            </h4>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>• 🚚 Vehicle Hire all (Small / Medium / Heavy)</p>
              <p>• 📦 Load Posting for Businesses and residential purpose also</p>
              <p>• 💰 Transparent Bidding & Price Discovery</p>
              <p>• ⚡ EV & Sustainable Transport Options</p>
               <p>• 📍 Location-based Vehicle Search & Match</p>
                <p>• 📲 Real-time Support & Tracking</p>
            </div>
          </motion.div>

          {/* Location */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Location className="h-5 w-5 mr-2 text-purple-400" />
              Our Offices
            </h4>
            <div className="text-gray-300 text-sm">
              <p>Chennai:#105, Poonamallee Bypass Road, Poonamallee – 600056</p>
              {/* <p>Madurai:#9, TCE TBI, Tiruparankundam – 625015</p>
              <p>Tirunelveli:#12, Kavalkinaru – 627105</p>
              <p>Nagercoil:#3, Bypass Road, Susindram – 629704</p> */}
            </div>
          </motion.div>
        </motion.div>

        {/* Network Animation */}
        <motion.div
          variants={itemVariants}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="inline-block mb-4"
          >
            <Network className="h-12 w-12 text-blue-400" />
          </motion.div>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            Connecting businesses across India with our extensive logistics network. 
            From small packages to large freight, we deliver excellence at every mile.
          </p>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2025 XBOW Logistics Pvt. Ltd. All rights reserved.
          </div>
          
          <div className="flex space-x-6 text-sm text-gray-400">
            <motion.a
              whileHover={{ color: '#60a5fa', scale: 1.1 }}
              href="#"
              className="hover:text-blue-400 transition-colors"
            >
              Privacy Policy
            </motion.a>
            <motion.a
              whileHover={{ color: '#60a5fa', scale: 1.1 }}
              href="#"
              className="hover:text-blue-400 transition-colors"
            >
              Terms of Service
            </motion.a>
            <motion.a
              whileHover={{ color: '#60a5fa', scale: 1.1 }}
              href="#"
              className="hover:text-blue-400 transition-colors"
            >
              Careers
            </motion.a>
          </div>
        </motion.div>
      </motion.div>

      {/* Subtle Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-blue-500/5 pointer-events-none" />
    </footer>
  );
};