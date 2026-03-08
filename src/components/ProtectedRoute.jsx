import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../cascading_style_sheets/ProtectedRoute.css';

export default function ProtectedRoute({ children }) {
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return null;
	}

	if (!isAuthenticated) {
		return (
			<div className="protected-screen">
				<div className="protected-overlay">
					<h1 className="protected-heading">Please sign in to continue</h1>
					<p className="protected-subtext">
						Use the Sign in button in the top right to get started.
					</p>
				</div>
			</div>
		);
	}

	return children;
}