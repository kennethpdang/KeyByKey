import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect } from 'react';

// Context
import { AuthProvider } from "./context/AuthContext";

// Components
import Navbar from "./components/Navbar";

// Pages
import Home from "./pages/Home";
import FlashcardCategories from "./pages/FlashcardCategories";
import Memorize from "./pages/Memorize";
import AboutUs from "./pages/AboutUs";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
		<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
			<AuthProvider>
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
			</AuthProvider>
		</GoogleOAuthProvider>
	);
}

export default App;