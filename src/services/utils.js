import gsap from "gsap";

export const animateBubble = (bubbleRef, turbulenceRef = null, color, isVoiceMode = true, amplitude) => {
    if (bubbleRef.current && isVoiceMode == true) {
        const mappedExageratedAmplitude = Math.min(Math.max((amplitude * 5), 0), 100) / 100; // Clamp amplitude to 0-100 and normalize
        const mappedAmplitude = Math.min(Math.max((amplitude * 2), 0), 100) / 100; // Clamp amplitude to 0-100 and normalize
        // Scale the element based on amplitude (map it between 0.8 and 1.1)
        const scaleValue = 1 + mappedAmplitude;

        // Gradient animation
        const minValue = 45; // Gradient stop at min amplitude
        const maxValue = 25;  // Gradient stop at max amplitude
        const gradientStop = minValue + (maxValue - minValue) * mappedExageratedAmplitude;

        gsap.to(bubbleRef.current, {
            scale: scaleValue,
            duration: 0.1,
            ease: "power4.out",
            overwrite: true
        });

        bubbleRef.current.style.background = `radial-gradient(circle, rgba(${color}, 0) ${gradientStop}%, rgba(${color}, 1) 75%)`;

        // Update the displacement map scale based on amplitude
        // Map amplitude (0 to 1) to baseFrequency (0 to 0.006)
        const minBaseFrequency = 0;
        const maxBaseFrequency = 1;
        const minBaseScale = 0;
        const maxBaseScale = 40;

        // const updatedBaseFrequency = minBaseFrequency + mappedAmplitude * (maxBaseFrequency - minBaseFrequency);
        // const updatedBaseScale = minBaseScale + mappedAmplitude * (maxBaseScale - minBaseScale);
        // if (turbulenceRef?.current) {
        //     turbulenceRef.current.setAttribute('baseFrequency', updatedBaseFrequency + " 0");
        //     turbulenceRef.current.setAttribute('scale', updatedBaseScale);

        //     // Reapply filter to target element
        //     if (bubbleRef.current && amplitude > 0.05) {
        //         bubbleRef.current.style.filter = 'none'; // Temporarily remove the filter
        //         requestAnimationFrame(() => {
        //             bubbleRef.current.style.filter = 'url(#warpFilter)';
        //         });
        //     } else {
        //         bubbleRef.current.style.filter = 'none';
        //     }
        // }
    }
}