import { useDrag } from "@use-gesture/react";
import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  horizontal?: boolean;
  useWindow?: boolean;
};

export type ScrollPosition = "start" | "middle" | "end";

/**
 * React hook to create a custom scrollbar.
 *
 * @param options - Optional options object.
 * @param options.horizontal - Whether the scrollbar is horizontal (Default: false).
 * @param options.useWindow - Whether the window should be used as scrollable element (Default: false).
 */
export const useScrollbar = <TElement extends HTMLElement = HTMLDivElement>({
  horizontal = false,
  useWindow = false,
}: Options = {}) => {
  const scrollableRef = useRef<TElement | HTMLElement | null>(null);
  const scrollbarTrackRef = useRef<HTMLDivElement | null>(null);
  const scrollbarSliderRef = useRef<HTMLDivElement | null>(null);

  const [canScroll, setCanScroll] = useState(false);
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>("start");

  const lastDown = useRef(false);
  const offsetSnapshot = useRef(0);

  // Handle scrollbar track drag.
  const bindScrollbarTrackProps = useDrag(({ down, movement: [mx, my] }) => {
    // We need all refs here.
    if (
      !scrollableRef.current ||
      !scrollbarTrackRef.current ||
      !scrollbarSliderRef.current
    ) {
      return;
    }

    // On each pointer up/down save the last scroll offset.
    if (lastDown.current !== down) {
      lastDown.current = down;

      offsetSnapshot.current = horizontal
        ? scrollableRef.current.scrollLeft
        : scrollableRef.current.scrollTop;
      return;
    }

    // Calculate the factor of the size difference between the scrollbar
    // width and the total scrollable width.
    // This factor is used to properly translate the dragged pixel value
    // to the correct scroll offset value.
    const factor = horizontal
      ? scrollableRef.current.scrollWidth /
        scrollbarTrackRef.current.getBoundingClientRect().width
      : scrollableRef.current.scrollHeight /
        scrollbarTrackRef.current.getBoundingClientRect().height;

    // Update the scroll offset of the scrollable element to the
    // dragged pixel count multiplied by the factor.
    if (horizontal) {
      scrollableRef.current.scrollLeft = offsetSnapshot.current + mx * factor;
    } else {
      scrollableRef.current.scrollTop = offsetSnapshot.current + my * factor;
    }
  });

  // Calculate percentage of how much content is
  // visible in percent of the scrollable element and how much
  // the content is scrolled in percent.
  const calculateOffsets = useCallback(
    () =>
      requestAnimationFrame(() => {
        const element = scrollableRef.current;
        if (!element) return;

        const { width, height } = useWindow
          ? { width: window.innerWidth, height: window.innerHeight }
          : element.getBoundingClientRect();

        const size = horizontal ? width : height;
        const totalSize = horizontal
          ? element.scrollWidth
          : element.scrollHeight;
        const scrollOffset = horizontal
          ? element.scrollLeft
          : element.scrollTop;

        const visiblePercent = (size * 100) / totalSize;
        const offsetPercent = (scrollOffset * 100) / totalSize;

        if (offsetPercent === 0) {
          setScrollPosition("start");
        } else if (offsetPercent + visiblePercent >= 100) {
          setScrollPosition("end");
        } else {
          setScrollPosition("middle");
        }

        setCanScroll(visiblePercent < 100);
        setScrollbar(visiblePercent, offsetPercent, horizontal, size);
      }),
    [useWindow, horizontal],
  );

  // Check if all refs have been set and monitor resizes of the
  // scrollable element. Also kick off the initial calculation.
  useEffect(() => {
    if (useWindow) {
      scrollableRef.current = document.documentElement;
    }

    if (!scrollableRef.current) {
      console.warn(
        "The scrollableRef must be set on the scrollable element for useScrollbar to work!",
      );
      return;
    }

    if (!scrollbarTrackRef.current) {
      console.warn(
        "The scrollbarTrackRef must be set on the scrollbar track element for useScrollbar to work!",
      );
      return;
    }

    if (!scrollbarSliderRef.current) {
      console.warn(
        "The scrollbarTrackRef must be set on the scrollbar slider element for useScrollbar to work!",
      );
      return;
    }

    // Disable touch action and selection for scrollbar slider.
    scrollbarSliderRef.current.style.touchAction = "none";
    scrollbarSliderRef.current.style.userSelect = "none";

    // Register resize observer.
    const resizeObserver = new ResizeObserver(() => {
      calculateOffsets();
    });

    resizeObserver.observe(scrollableRef.current);
    calculateOffsets();

    if (useWindow) {
      window.addEventListener("scroll", calculateOffsets);
      window.addEventListener("resize", calculateOffsets);
    }

    // Cleanup function.
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", calculateOffsets);
      window.removeEventListener("resize", calculateOffsets);
    };
  }, [useWindow, calculateOffsets]);

  // Sets the scrollbar properties on animation frame.
  const setScrollbar = (
    visiblePercent: number,
    offsetPercent: number,
    horizontal: boolean,
    size: number,
  ) =>
    requestAnimationFrame(() => {
      if (!scrollbarSliderRef.current) return;

      if (horizontal) {
        scrollbarSliderRef.current.style.width = visiblePercent + "%";
        scrollbarSliderRef.current.style.marginLeft = offsetPercent + "%";
      } else {
        scrollbarSliderRef.current.style.height =
          (size * visiblePercent) / 100 + "px";
        scrollbarSliderRef.current.style.marginTop =
          (size * offsetPercent) / 100 + "px";
      }
    });

  // Returns props to add to the scrollable element as props.
  const bindScrollableProps = useCallback(() => {
    // Safety Net.
    if (useWindow) {
      return {};
    }

    return {
      onScroll: calculateOffsets,
    };
  }, [useWindow, calculateOffsets]);

  return {
    canScroll,
    scrollPosition,
    scrollableRef,
    scrollbarTrackRef,
    scrollbarSliderRef,
    bindScrollableProps,
    bindScrollbarTrackProps,
  };
};
