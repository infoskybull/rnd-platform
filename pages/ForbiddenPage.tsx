import React from "react";
import { useNavigate } from "react-router-dom";
import RnDLogo from "../components/icons/RnDLogo";
import { Home, ArrowLeft, ShieldOff } from "lucide-react";
import { gsap } from "gsap";

const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  const logoRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const tl = gsap.timeline();

    if (logoRef.current) {
      tl.fromTo(
        logoRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        }
      );
    }

    if (contentRef.current) {
      tl.fromTo(
        contentRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
        "-=0.4"
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div ref={logoRef} className="flex justify-center mb-6">
            <RnDLogo size={80} />
          </div>
        </div>

        <div ref={contentRef} className="text-center">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <ShieldOff className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">403 Forbidden</h2>
          <p className="text-gray-400 mb-8">
            You don't have permission to access this resource.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
