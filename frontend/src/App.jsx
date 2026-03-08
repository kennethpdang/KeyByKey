import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect } from 'react';

// Components
import Navbar from "./components/Navbar";

// Pages
import Home from "./pages/Home";
import FlashcardCategories from "./pages/FlashcardCategories";
import Memorize from "./pages/Memorize";
import AboutUs from "./pages/AboutUs";

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
					<Route path="/" element={<Home />} />
					<Route path="/memorize/:id?" element={<Memorize />} />
					<Route path="/flashcard-categories" element={<FlashcardCategories />} />
					<Route path="/about-us" element={<AboutUs />} />
				</Routes>
			</BrowserRouter>
		</div>
	);
}

export default App;