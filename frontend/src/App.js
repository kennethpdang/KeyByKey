import { BrowserRouter, Routes, Route } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import React,  {useEffect } from 'react';

// Components
import Navbar from "./components/Navbar.js";

// Pages
import Home from "./pages/Home.js"
import AboutUs from "./pages/AboutUs.js"
import Memorize from "./pages/Memorize.js"

function App() {
    useEffect(() => {
        const images = [
            '/memorize_link_image.png',
            '/flashcard_link_image.png',
            '/aboutus_link_image.png'
        ];

        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
      }, []);

    return (
    <div className="App">
        <BrowserRouter>
        <Navbar />
        <Routes>
            <Route
                path = "/"
                element = {<Home />}
            />
            <Route
                path = "/memorize"
                element = {<Memorize />}
            />
            <Route
                path = "/about-us"
                element = {<AboutUs />}
            />
        </Routes>
        </BrowserRouter>
    </div>
    );
}

export default App;