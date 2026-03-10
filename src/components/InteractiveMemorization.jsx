import React, { useRef, useMemo, useEffect, useState } from "react";
import Speedometer from "./Speedometer";
import Feedback from "./Feedback";
import GuidedText from "./GuidedText";
import useKeyPress from "../hooks/useKeyPress";
import useHiddenText from "../hooks/useHiddenText";
import { buildSpinVisibility } from "../utils/textProcessing";
import "../cascading_style_sheets/InteractiveMemorization.css";

const CHARACTER_HEIGHT = 65;
const TARGET_SCROLL_LINE = 7;
const SCROLL_TRANSITION_MS = 250;

const InteractiveMemorization = ({ hiddenText, mode = "BRAIN", flashcardId, onReviewed }) => {
	const processedText = hiddenText;
	const isLongContent = hiddenText.length > 350;

	const spinVisibility = useMemo(() => {
		if (mode !== "SPIN") {
			return null;
		}

		return buildSpinVisibility(hiddenText);
	}, [mode, hiddenText]);

	const {
		feedback,
		shaking,
		completed,
		accuracy,
		handleKeyDown,
		pointer
	} = useHiddenText(processedText);

	const postedRef = useRef(false);
	const contentRef = useRef(null);
	const viewportRef = useRef(null);
	const [translateY, setTranslateY] = useState(0);
	const scrollLockRef = useRef(false);
	const scrollCountRef = useRef(0);

	// Reset scroll state when flashcard changes.
	useEffect(() => {
		postedRef.current = false;
		setTranslateY(0);
		scrollLockRef.current = false;
		scrollCountRef.current = 0;
	}, [flashcardId]);

	// Post review on BRAIN mode mastery.
	useEffect(() => {
		const shouldPostReview = (
			!postedRef.current &&
			completed &&
			mode === "BRAIN" &&
			accuracy >= 90 &&
			flashcardId
		);

		if (!shouldPostReview) {
			return;
		}

		postedRef.current = true;

		fetch(`/api/flashcards/${flashcardId}/review`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mode: 'BRAIN', accuracy })
		})
			.then(() => {
				if (onReviewed) {
					onReviewed();
				}
			})
			.catch(console.error);
	}, [completed, accuracy, mode, flashcardId, onReviewed]);

	// Line-based auto-scroll: keeps the cursor on the target line.
	useEffect(() => {
		if (!contentRef.current || !viewportRef.current || !isLongContent) {
			return;
		}

		if (scrollLockRef.current) {
			return;
		}

		let cursorElement = null;

		if (mode === "BRAIN") {
			const allCharacters = contentRef.current.querySelectorAll('.character');
			cursorElement = allCharacters[allCharacters.length - 1];
		} else {
			const typedCharacters = contentRef.current.querySelectorAll('.character.correct, .character.incorrect');
			cursorElement = typedCharacters[typedCharacters.length - 1];
		}

		if (!cursorElement) {
			return;
		}

		const viewportRect = viewportRef.current.getBoundingClientRect();
		const cursorRect = cursorElement.getBoundingClientRect();
		const cursorFromViewportTop = cursorRect.top - viewportRect.top;

		const scrolledAmount = scrollCountRef.current * CHARACTER_HEIGHT;
		const cursorAbsoluteY = cursorFromViewportTop + scrolledAmount;
		const currentAbsoluteLine = Math.floor(cursorAbsoluteY / CHARACTER_HEIGHT) + 1;
		const targetScrollCount = Math.max(0, currentAbsoluteLine - TARGET_SCROLL_LINE);

		if (targetScrollCount > scrollCountRef.current) {
			scrollLockRef.current = true;

			const scrollsNeeded = targetScrollCount - scrollCountRef.current;
			const scrollAmount = scrollsNeeded * CHARACTER_HEIGHT;

			setTranslateY(previous => previous - scrollAmount);
			scrollCountRef.current = targetScrollCount;

			setTimeout(() => {
				scrollLockRef.current = false;
			}, SCROLL_TRANSITION_MS);
		}
	}, [feedback.length, mode, isLongContent]);

	useKeyPress(handleKeyDown);

	const screenRef = useRef(null);
	const focusScreen = () => screenRef.current?.focus();

	const renderBody = () => {
		if (completed) {
			return <div className="completion-message">Completed!</div>;
		}

		if (mode === "BRAIN") {
			return <Feedback feedback={feedback} shaking={shaking} />;
		}

		return (
			<GuidedText
				text={processedText}
				feedback={feedback}
				pointer={pointer}
				mode={mode}
				spinVisibility={spinVisibility}
				shaking={shaking}
			/>
		);
	};

	const isGuidedMode = mode !== "BRAIN";

	const screenClassName = [
		"screen",
		isGuidedMode ? "guided" : "",
		isLongContent ? "long-content-screen" : ""
	].filter(Boolean).join(" ");

	return (
		<div
			ref={screenRef}
			className={screenClassName}
			tabIndex={0}
			onClick={focusScreen}
		>
			<Speedometer percentage={accuracy} />
			<div
				className={`text-viewport ${isLongContent ? 'long-content' : 'short-content'}`}
				ref={viewportRef}
			>
				<div
					className="text-content-container"
					ref={contentRef}
					style={{ transform: `translateY(${translateY}px)` }}
				>
					{renderBody()}
				</div>
			</div>
		</div>
	);
};

export default InteractiveMemorization;