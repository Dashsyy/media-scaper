import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

interface TourOverlayProps {
  onFinish: () => void;
}

const TourOverlay = ({ onFinish }: TourOverlayProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0); // 0 is welcome, 1-4 are steps
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      title: t("tour.welcome"),
      description: t("tour.description"),
      targetId: null,
    },
    {
      title: t("tour.step1_title"),
      description: t("tour.step1_desc"),
      targetId: "tour-step-1",
    },
    {
      title: t("tour.step2_title"),
      description: t("tour.step2_desc"),
      targetId: "tour-step-2",
    },
    {
      title: t("tour.step3_title"),
      description: t("tour.step3_desc"),
      targetId: "tour-step-3",
    },
    {
      title: t("tour.step4_title"),
      description: t("tour.step4_desc"),
      targetId: "tour-step-4",
    },
  ];

  const currentStep = steps[step];

  const updateTargetRect = () => {
    if (currentStep.targetId) {
      const element = document.getElementById(currentStep.targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Small delay to allow scroll to settle
        setTimeout(() => {
          setTargetRect(element.getBoundingClientRect());
        }, 300);
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    return () => window.removeEventListener("resize", updateTargetRect);
  }, [step]);

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  const skipTour = () => {
    onFinish();
  };

  // Prevent background scrolling when tour is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Spotlight style (clip-path hole)
  const spotlightStyle: React.CSSProperties = targetRect ? {
    clipPath: `polygon(
      0% 0%, 0% 100%, 
      ${targetRect.left - 8}px 100%, 
      ${targetRect.left - 8}px ${targetRect.top - 8}px, 
      ${targetRect.right + 8}px ${targetRect.top - 8}px, 
      ${targetRect.right + 8}px ${targetRect.bottom + 8}px, 
      ${targetRect.left - 8}px ${targetRect.bottom + 8}px, 
      ${targetRect.left - 8}px 100%, 
      100% 100%, 100% 0%
    )`
  } : {};

  // Tooltip position logic
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "fixed"
      };
    }

    const isMobile = window.innerWidth < 768;
    const padding = 20;
    
    // Default: try to put it below the target
    let top = targetRect.bottom + padding;
    let left = targetRect.left + (targetRect.width / 2) - 200; // Center bubble horizontally (width is 400px)

    // Adjust if it goes off screen
    if (left < padding) left = padding;
    if (left + 400 > window.innerWidth - padding) left = window.innerWidth - 400 - padding;

    // If it's too close to the bottom, put it above
    if (top + 250 > window.innerHeight) {
      top = targetRect.top - padding - 250; // Assume bubble height is ~250
    }

    if (isMobile) {
      return {
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        position: "fixed",
        width: "calc(100% - 40px)",
        maxWidth: "400px"
      };
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      position: "fixed",
      width: "400px"
    };
  };

  return (
    <div className="fixed inset-0 z-[100] transition-all duration-500">
      {/* Dark Backdrop with Spotlight */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] transition-all duration-500"
        style={spotlightStyle}
      />

      {/* Floating Tour Bubble */}
      <div 
        ref={containerRef}
        style={getTooltipStyle()}
        className="z-[110] overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-500"
      >
        <div className="bg-blue-600 p-5 text-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
              {step === 0 ? t("tour.welcome") : `Step ${step} / ${steps.length - 1}`}
            </span>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 w-4 rounded-full transition-all ${i === step ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </div>
          </div>
          <h2 className="text-xl font-bold leading-tight">{currentStep.title}</h2>
        </div>
        
        <div className="p-6">
          <p className="text-base text-slate-600 leading-relaxed">
            {currentStep.description}
          </p>
          
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={skipTour}
              className="text-slate-400 hover:text-slate-600"
            >
              {t("tour.skip")}
            </Button>
            
            <Button
              onClick={nextStep}
              className="bg-blue-600 px-6 py-5 text-base font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
            >
              {step === 0 ? t("tour.start") : step === steps.length - 1 ? t("tour.finish") : t("tour.next")}
            </Button>
          </div>
        </div>
      </div>

      {/* Pulsing Highlight Border */}
      {targetRect && (
        <div 
          className="pointer-events-none fixed z-[105] rounded-xl border-4 border-blue-400/80 animate-pulse shadow-[0_0_0_4px_rgba(59,130,246,0.3)]"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            transition: "all 0.3s ease-in-out"
          }}
        />
      )}

      {/* Arrow Indicator */}
      {targetRect && (
        <div 
          className="pointer-events-none fixed z-[120] text-blue-500 animate-bounce"
          style={{
            top: targetRect.top - 40,
            left: targetRect.left + (targetRect.width / 2) - 15,
            transition: "all 0.3s ease-in-out"
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 5v10.17l-3.59-3.58L6 13l6 6 6-6-1.41-1.41L13 15.17V5h-2z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default TourOverlay;
