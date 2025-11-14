import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import RnDLogo from "../components/icons/RnDLogo";
import AIChatBubble from "../components/AIChatBubble";
import { GamepadIcon, CameraIcon } from "../components/icons/Icons";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Refs for animations
  const heroRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const gamesRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorTrailRef = useRef<HTMLDivElement>(null);
  const dynamicTextRef = useRef<HTMLSpanElement>(null);
  const scrollTopRef = useRef<HTMLButtonElement>(null);

  // Mouse tracking and cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Update cursor position
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1,
          ease: "power2.out",
        });
      }

      // Update cursor trail
      if (cursorTrailRef.current) {
        gsap.to(cursorTrailRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        target.matches &&
        target.matches("button, a, .hover-effect")
      ) {
        if (cursorRef.current) {
          gsap.to(cursorRef.current, {
            scale: 2,
            backgroundColor: "#8b5cf6",
            duration: 0.3,
            ease: "power2.out",
          });
        }
        if (cursorTrailRef.current) {
          gsap.to(cursorTrailRef.current, {
            scale: 1.5,
            backgroundColor: "#8b5cf6",
            duration: 0.3,
            ease: "power2.out",
          });
        }
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        target.matches &&
        target.matches("button, a, .hover-effect")
      ) {
        if (cursorRef.current) {
          gsap.to(cursorRef.current, {
            scale: 1,
            backgroundColor: "#6366f1",
            duration: 0.3,
            ease: "power2.out",
          });
        }
        if (cursorTrailRef.current) {
          gsap.to(cursorTrailRef.current, {
            scale: 1,
            backgroundColor: "#6366f1",
            duration: 0.3,
            ease: "power2.out",
          });
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter, true);
    document.addEventListener("mouseleave", handleMouseLeave, true);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter, true);
      document.removeEventListener("mouseleave", handleMouseLeave, true);
    };
  }, []);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Dynamic text animation
  useEffect(() => {
    const dynamicTexts = [
      "Games",
      "Adventures",
      "Experiences",
      "Worlds",
      "Stories",
      "Journeys",
    ];

    let currentIndex = 0;

    const animateText = () => {
      if (dynamicTextRef.current) {
        gsap.to(dynamicTextRef.current, {
          duration: 0.5,
          opacity: 0,
          y: -20,
          ease: "power2.inOut",
          onComplete: () => {
            if (dynamicTextRef.current) {
              dynamicTextRef.current.textContent = dynamicTexts[currentIndex];
              gsap.to(dynamicTextRef.current, {
                duration: 0.5,
                opacity: 1,
                y: 0,
                ease: "power2.inOut",
              });
            }
            currentIndex = (currentIndex + 1) % dynamicTexts.length;
          },
        });
      }
    };

    // Start text animation after initial load
    const textInterval = setInterval(animateText, 3000);

    return () => clearInterval(textInterval);
  }, []);

  useEffect(() => {
    // Add a small delay to ensure DOM elements are fully rendered
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Navbar animation
        if (navbarRef.current) {
          gsap.fromTo(
            navbarRef.current,
            { y: -100, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
          );
        }

        // Logo animation
        if (logoRef.current) {
          gsap.fromTo(
            logoRef.current,
            { scale: 0, rotation: -180, opacity: 0 },
            {
              scale: 1,
              rotation: 0,
              opacity: 1,
              duration: 1,
              ease: "back.out(1.7)",
              delay: 0.2,
            }
          );
        }

        // Hero section animations
        if (titleRef.current && subtitleRef.current && ctaRef.current) {
          const heroTl = gsap.timeline({ delay: 0.5 });

          heroTl
            .fromTo(
              titleRef.current,
              { y: 100, opacity: 0 },
              { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
            )
            .fromTo(
              subtitleRef.current,
              { y: 50, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
              "-=0.6"
            )
            .fromTo(
              ctaRef.current,
              { y: 30, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
              "-=0.4"
            );

          // Floating animation for hero elements
          gsap.to([titleRef.current, subtitleRef.current], {
            y: -10,
            duration: 2,
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1,
            stagger: 0.2,
          });
        }

        // Features section scroll animations
        if (featuresRef.current) {
          const featureCards =
            featuresRef.current.querySelectorAll(".feature-card");
          if (featureCards.length > 0) {
            gsap.fromTo(
              featureCards,
              { y: 100, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out",
                stagger: 0.2,
                scrollTrigger: {
                  trigger: featuresRef.current,
                  start: "top 80%",
                  end: "bottom 20%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }
        }

        // Games showcase scroll animations
        if (gamesRef.current) {
          const gameCards = gamesRef.current.querySelectorAll(".game-card");
          if (gameCards.length > 0) {
            gsap.fromTo(
              gameCards,
              { scale: 0.8, opacity: 0, rotationY: 45 },
              {
                scale: 1,
                opacity: 1,
                rotationY: 0,
                duration: 1,
                ease: "power3.out",
                stagger: 0.15,
                scrollTrigger: {
                  trigger: gamesRef.current,
                  start: "top 80%",
                  end: "bottom 20%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }
        }

        // Parallax effect for hero background - REMOVED to fix full screen view

        // Footer animation
        if (footerRef.current) {
          gsap.fromTo(
            footerRef.current,
            { y: 100, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: footerRef.current,
                start: "top 90%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }
      }, [
        heroRef,
        navbarRef,
        logoRef,
        titleRef,
        subtitleRef,
        ctaRef,
        featuresRef,
        gamesRef,
        footerRef,
      ]);

      return () => {
        // Cleanup
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    }, 100); // 100ms delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
      // Cleanup
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const handleSignIn = () => {
    navigate("/login");
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Custom Cursor */}
      <div
        ref={cursorRef}
        className="fixed w-6 h-6 bg-indigo-500 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{ transform: "translate(-50%, -50%)" }}
      />
      <div
        ref={cursorTrailRef}
        className="fixed w-12 h-12 bg-indigo-500/30 rounded-full pointer-events-none z-[9998] mix-blend-difference"
        style={{ transform: "translate(-50%, -50%)" }}
      />

      {/* Navbar */}
      <nav
        ref={navbarRef}
        className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800"
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div ref={logoRef}>
                <RnDLogo size={32} className="sm:w-10 sm:h-10" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                RnD <span className="text-indigo-400">Game</span> Marketplace
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={handleSignIn}
                className="hover-effect px-3 sm:px-6 py-2 text-xs sm:text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition-all duration-300 hover:border-indigo-500 hover:scale-105"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUp}
                className="hover-effect px-3 sm:px-6 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg border border-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900/20 to-purple-900/20 overflow-hidden"
        style={{
          height: "100vh",
          minHeight: "100vh",
          width: "100vw",
          maxWidth: "100vw",
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-64 sm:h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-48 sm:h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10 h-full flex flex-col justify-center items-center">
          <h1
            ref={titleRef}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent leading-tight"
          >
            Discover Amazing
            <br />
            <span className="text-indigo-400">
              <span ref={dynamicTextRef}>Games</span>
            </span>
          </h1>

          <p
            ref={subtitleRef}
            className="text-base sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed px-4"
          >
            Explore a world of innovative games created by talented developers.
            From indie gems to AAA experiences, find your next gaming adventure.
          </p>

          <div
            ref={ctaRef}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4"
          >
            <button
              onClick={handleSignUp}
              className="hover-effect w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl border border-indigo-500 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/25 hover:scale-105"
            >
              Start Exploring
            </button>
            <button
              onClick={handleSignIn}
              className="hover-effect w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-xl border border-gray-600 hover:border-indigo-500 transition-all duration-300 hover:scale-105"
            >
              Browse Games
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-4 h-8 sm:w-6 sm:h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-2 sm:h-3 bg-gray-400 rounded-full mt-1 sm:mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        className="py-12 sm:py-16 lg:py-20 bg-gray-800/30"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Why Choose Our{" "}
              <span className="text-indigo-400">Marketplace</span>?
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              We provide the best platform for both game developers and players
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="feature-card bg-gray-800/50 p-6 sm:p-8 rounded-2xl border border-gray-700 hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-105">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                Lightning Fast
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Experience games with optimized performance and instant loading
                times
              </p>
            </div>

            <div className="feature-card bg-gray-800/50 p-6 sm:p-8 rounded-2xl border border-gray-700 hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-105">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                Secure Platform
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Your data and purchases are protected with enterprise-grade
                security
              </p>
            </div>

            <div className="feature-card bg-gray-800/50 p-6 sm:p-8 rounded-2xl border border-gray-700 hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-105 md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                Community Driven
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Join a vibrant community of developers and gamers sharing their
                passion
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Games Showcase */}
      <section ref={gamesRef} className="py-12 sm:py-16 lg:py-20 bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Featured <span className="text-indigo-400">Games</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Discover the most popular and innovative games on our platform
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((game) => (
              <div
                key={game}
                className="game-card bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-105"
              >
                <div className="h-40 sm:h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                  <div className="text-4xl sm:text-6xl">
                    <GamepadIcon className="w-16 h-16 mx-auto text-blue-400" />
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-2">
                    Amazing Game {game}
                  </h3>
                  <p className="text-gray-300 mb-4 text-sm sm:text-base">
                    Experience the thrill of adventure in this incredible game
                  </p>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <span className="text-xl sm:text-2xl font-bold text-indigo-400">
                      $19.99
                    </span>
                    <button className="hover-effect w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm sm:text-base">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        ref={footerRef}
        className="bg-gray-800/50 border-t border-gray-700 py-8 sm:py-12"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <RnDLogo size={28} className="sm:w-8 sm:h-8" />
                <h3 className="text-lg sm:text-xl font-bold">
                  RnD Game Marketplace
                </h3>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                The ultimate destination for discovering and sharing amazing
                games.
              </p>
              <div className="flex space-x-3 sm:space-x-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer">
                  <span className="text-white text-sm sm:text-base">📘</span>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer">
                  <span className="text-white text-sm sm:text-base">🐦</span>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer">
                  <span className="text-white text-sm sm:text-base">
                    <CameraIcon className="w-5 h-5" />
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                Platform
              </h4>
              <ul className="space-y-2 text-gray-300 text-sm sm:text-base">
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Browse Games
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Creator Tools
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    API Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Community
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                Support
              </h4>
              <ul className="space-y-2 text-gray-300 text-sm sm:text-base">
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
            <p>&copy; 2024 RnD Game Marketplace. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* AI Chat Bubble */}
      <AIChatBubble />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          ref={scrollTopRef}
          onClick={scrollToTop}
          className="fixed bottom-20 sm:bottom-20 right-4 sm:right-6 z-40 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover-effect flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default LandingPage;
