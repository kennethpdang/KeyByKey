import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../cascading_style_sheets/Navbar.css';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggleMenu = () => {
        setIsOpen((prevState) => !prevState);
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand">
                    <img src="/logo.svg" alt="Logo" className="logo" />
                </div>
                <button className="navbar-toggle" onClick={handleToggleMenu}>
                    <i className="fas fa-bars"></i>
                </button>
            </div>
            {isOpen && (
                <div className="navbar-menu">
                    <Link to="/memorize" className="navbar-link">
                        <div className="navbar-image-container">
                            <img
                                src="/memorize_link_image.png"
                                alt="Memorize Option"
                                className="navbar-link-image"
                            />
                            <div className="navbar-image-text">Memorize</div>
                        </div>
                    </Link>
                    <Link to="/flashcards" className="navbar-link">
                        <div className="navbar-image-container">
                            <img
                                src="/flashcard_link_image.png"
                                alt="Flashcards Option"
                                className="navbar-link-image"
                            />
                            <div className="navbar-image-text">Flashcards Categories</div>
                        </div>
                    </Link>
                    <Link to="/about-us" className="navbar-link">
                        <div className="navbar-image-container">
                            <img
                                src="/aboutus_link_image.png"
                                alt="About Us Option"
                                className="navbar-link-image"
                            />
                            <div className="navbar-image-text">About Us</div>
                        </div>
                    </Link>
                </div>
            )}
        </nav>
    );
}

export default Navbar;