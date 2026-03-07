import React from "react";
import "../cascading_style_sheets/InteractiveMemorization.css";

const Feedback = ({ feedback, shaking }) => {
return (
    <div className={`feedback-container ${shaking ? "shake" : ""}`}>
    {feedback.map((item, index) =>
        item.char === "\n" ? (
        <br key={index} />
        ) : (
        <span
            key={index}
            className={`character ${item.correct ? "correct" : "incorrect"}`}
        >
            {item.char}
        </span>
        )
    )}
    </div>
);
};

export default Feedback;