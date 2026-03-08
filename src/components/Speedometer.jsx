import React from "react";
import "../cascading_style_sheets/InteractiveMemorization.css";

const Speedometer = ({ percentage }) => {
    return (
        <div className="speedometer">
        <div className="speedometer-value">{percentage}%</div>
        </div>
    );
};

export default Speedometer;
