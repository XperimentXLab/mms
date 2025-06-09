import React, { useState } from "react";

const SlideCaptcha = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);

  const handleDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    const maxWidth = 300;
    const newPosition = Math.min(event.clientX - 30, maxWidth - 50);

    setSliderPosition(newPosition);

    if (newPosition >= maxWidth - 60) {
      setIsCompleted(true);
      onSuccess(); // Callback when slider is completed
    }
  };

  return (
    <div className="relative w-[300px] h-[60px] bg-gray-200 rounded-lg flex items-center">
      <div
        className="absolute left-0 w-[50px] h-[50px] bg-blue-500 rounded-lg cursor-pointer"
        onMouseDown={handleDrag}
        style={{ left: sliderPosition }}
      />
      <p className={`text-center w-full ${isCompleted ? "text-green-500" : "text-gray-500"}`}>
        {isCompleted ? "Verified!" : "Slide to verify"}
      </p>
    </div>
  );
};

export default SlideCaptcha;
