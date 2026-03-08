import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowCircleDown, Plus, PencilSimple, Trash, X } from '@phosphor-icons/react';
import TableCardFields from './TableCardFields';
import '../cascading_style_sheets/FlashcardsTray.css';

function daysUntil(dateStr) {
	if (!dateStr) {
		return null;
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const due = new Date(dateStr);
	due.setHours(0, 0, 0, 0);

	const differenceInMs = due - today;

	return Math.round(differenceInMs / (1000 * 60 * 60 * 24));
}

function renderDue(card) {
	const daysRemaining = daysUntil(card.nextDueAt);

	if (daysRemaining === null || (card.masteredCount ?? 0) === 0) {
		return "Flashcard Not Yet Mastered";
	}

	const label = daysRemaining === 1 ? "day" : "days";
	return `${daysRemaining} ${label} until due`;
}

function getDueStyle(card) {
	const daysRemaining = daysUntil(card.nextDueAt);

	if (daysRemaining === null || (card.masteredCount ?? 0) === 0) {
		return {};
	}

	if (daysRemaining <= 0) {
		return { color: 'red' };
	}

	if (daysRemaining <= 3) {
		return { color: 'yellow' };
	}

	return {};
}

function getCardDescription(card) {
	if (card.type === 'table') {
		const table = card.table;

		if (table && table.rows && table.cols) {
			return `Table (${table.rows}×${table.cols})`;
		}

		return 'Table card';
	} else {
		const content = card.content || '';
		return content.length > 250 ? `${content.substring(0, 250)}...` : content;
	}
}

function FlashcardsTray({ isOpen, togglePanel, flashcards, handleDelete, onFlashcardAdded, onFlashcardEdited }) {
	const [showAddModal, setShowAddModal] = useState(false);
	const [newHeader, setNewHeader] = useState("");
	const [newContent, setNewContent] = useState("");
	const [newCategory, setNewCategory] = useState("");
	const [error, setError] = useState(null);
	const [categories, setCategories] = useState([]);

	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [cardToDelete, setCardToDelete] = useState(null);

	const [editModalVisible, setEditModalVisible] = useState(false);
	const [flashcardToEdit, setFlashcardToEdit] = useState(null);
	const [editHeader, setEditHeader] = useState("");
	const [editContent, setEditContent] = useState("");
	const [editCategory, setEditCategory] = useState("");

	const [focusedIndex, setFocusedIndex] = useState(0);
	const itemRefs = useRef([]);

	const [newType, setNewType] = useState("text");
	const [newTable, setNewTable] = useState(null);

	const [editType, setEditType] = useState("text");
	const [editTable, setEditTable] = useState(null);

	useEffect(() => {
		itemRefs.current = itemRefs.current.slice(0, flashcards.length);

		if (focusedIndex >= flashcards.length) {
			setFocusedIndex(0);
		}
	}, [flashcards, focusedIndex]);

	useEffect(() => {
		if (isOpen && flashcards.length > 0) {
			setFocusedIndex((index) => (index < flashcards.length ? index : 0));
		}
	}, [isOpen, flashcards.length]);

	const focusItem = (index) => {
		setFocusedIndex(index);

		const element = itemRefs.current[index];

		if (element) {
			element.focus();
		}
	};

	const navigate = useNavigate();

	const onListKeyDown = (event) => {
		if (!flashcards.length) {
			return;
		}

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				focusItem((focusedIndex + 1) % flashcards.length);
				break;
			case 'ArrowUp':
				event.preventDefault();
				focusItem((focusedIndex - 1 + flashcards.length) % flashcards.length);
				break;
			case 'Home':
				event.preventDefault();
				focusItem(0);
				break;
			case 'End':
				event.preventDefault();
				focusItem(flashcards.length - 1);
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				navigate(`/memorize/${flashcards[focusedIndex]._id}`);
				break;
			default:
				break;
		}
	};

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await fetch('/api/collections/');
				const data = await response.json();
				setCategories(data);
			} catch (error) {
				console.error("Failed to fetch categories:", error);
			}
		};

		fetchCategories();
	}, []);

	const handleAddIconClick = () => {
		setShowAddModal(true);
	};

	const closeModal = () => {
		setShowAddModal(false);
		setError(null);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError(null);

		let body;

		if (newType === "table") {
			if (
				!newTable ||
				!Number.isInteger(newTable.rows) ||
				!Number.isInteger(newTable.cols) ||
				!Array.isArray(newTable.cells)
			) {
				setError("Please configure a valid table (pick size and fill cells).");
				return;
			}

			body = {
				header: (newHeader || "").trim(),
				type: "table",
				content: "",
				table: newTable,
				collectionRef: newCategory,
			};
		} else {
			if (!newContent || !newContent.trim()) {
				setError("Content is required for text cards.");
				return;
			}

			body = {
				header: (newHeader || "").trim(),
				type: "text",
				content: newContent,
				table: null,
				collectionRef: newCategory,
			};
		}

		if (!body.header) {
			setError("Title is required.");
			return;
		}

		if (!body.collectionRef) {
			setError("Please choose a collection.");
			return;
		}

		try {
			const response = await fetch("/api/flashcards/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const json = await response.json();

			if (!response.ok) {
				setError(json?.error || "Failed to create flashcard.");
				return;
			}

			setNewHeader("");
			setNewContent("");
			setNewCategory("");
			setNewType("text");
			setNewTable(null);

			closeModal();

			if (onFlashcardAdded) {
				onFlashcardAdded(json);
			}
		} catch (error) {
			console.error(error);
			setError("Network error creating flashcard.");
		}
	};

	const showDeleteConfirmation = (id) => {
		setCardToDelete(id);
		setDeleteModalVisible(true);
	};

	const handleDeleteConfirm = () => {
		handleDelete(cardToDelete);
		setDeleteModalVisible(false);
		setCardToDelete(null);
	};

	const handleDeleteCancel = () => {
		setDeleteModalVisible(false);
		setCardToDelete(null);
	};

	const openEditModal = (flashcard) => {
		setFlashcardToEdit(flashcard);
		setEditHeader(flashcard.header);
		setEditContent(flashcard.content || "");
		setEditCategory(flashcard.collectionRef ? flashcard.collectionRef._id : "");
		setEditType(flashcard.type || "text");
		setEditTable(flashcard.table || null);
		setEditModalVisible(true);
	};

	const closeEditModal = () => {
		setEditModalVisible(false);
		setFlashcardToEdit(null);
		setError(null);
		setEditType("text");
		setEditTable(null);
	};

	const handleEditSubmit = async (event) => {
		event.preventDefault();

		if (!flashcardToEdit) {
			return;
		}

		const body = editType === 'table'
			? {
				header: editHeader,
				type: 'table',
				content: '',
				table: editTable,
				collectionRef: editCategory
			}
			: {
				header: editHeader,
				type: 'text',
				content: editContent,
				table: null,
				collectionRef: editCategory
			};

		try {
			const response = await fetch(`/api/flashcards/${flashcardToEdit._id}`, {
				method: 'PATCH',
				body: JSON.stringify(body),
				headers: { 'Content-Type': 'application/json' },
			});

			const json = await response.json();

			if (!response.ok) {
				setError(json.error);
			} else {
				closeEditModal();
				onFlashcardEdited(json);
			}
		} catch (error) {
			setError("An unexpected error occurred.");
			console.error(error);
		}
	};

	const handleFlashcardClick = (cardId) => {
		navigate(`/memorize/${cardId}`);
	};

	return (
		<>
			<div className={`tray-container ${isOpen ? 'open' : 'closed'}`}>
				<div className="tray-header">
					<div className="header-left">
						<div className="toggle-icon" onClick={togglePanel}>
							<ArrowCircleDown
								size={32}
								color="#fff"
								className={isOpen ? 'rotate' : 'closed'}
							/>
						</div>
					</div>
					<div className="header-center">
						{isOpen && <span className="tray-title">Flashcards</span>}
					</div>
					<div className="header-right">
						{isOpen && (
							<div className="add-icon" onClick={handleAddIconClick}>
								<Plus size={32} color="#fff" />
							</div>
						)}
					</div>
				</div>
				{isOpen && (
					<div
						className="tray-list"
						role="listbox"
						aria-label="Flashcards"
						onKeyDown={onListKeyDown}
						tabIndex={0}
					>
						{flashcards.map((card, index) => (
							<div
								className="flashcard-item"
								key={card._id}
								onClick={() => handleFlashcardClick(card._id)}
								role="option"
								aria-selected={index === focusedIndex}
								tabIndex={index === focusedIndex ? 0 : -1}
								ref={(element) => (itemRefs.current[index] = element)}
								onFocus={() => setFocusedIndex(index)}
							>
								<div className="flashcard-header-container">
									<div className="flashcard-header">{card.header}</div>
									<div className="action-buttons" onClick={(event) => event.stopPropagation()}>
										<button className="edit-button" onClick={() => openEditModal(card)}>
											<PencilSimple size={18} color="#fff" />
										</button>
										<button className="delete-button" onClick={() => showDeleteConfirmation(card._id)}>
											<Trash size={18} color="red" />
										</button>
									</div>
								</div>
								<div className="flashcard-category">
								{card.collectionRef && card.collectionRef.title}
								</div>
								<div className="flashcard-description">
									{getCardDescription(card)}
								</div>
								<div className="flashcard-due-date" style={getDueStyle(card)}>
									{renderDue(card)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Add Flashcard Modal */}
			{showAddModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<div className="modal-header">
							<h2>Add Flashcard</h2>
							<button className="exit-button" onClick={closeModal}>
								<X size={24} color="#fff" />
							</button>
						</div>
						<form onSubmit={handleSubmit} className="modal-form">
							<div className="form-group">
								<label htmlFor="flashcardHeader">Header</label>
								<input
									type="text"
									id="flashcardHeader"
									value={newHeader}
									onChange={(event) => setNewHeader(event.target.value)}
									placeholder="Enter flashcard header/question"
									autoComplete="off"
									required
								/>
							</div>
							<TableCardFields
								type={newType} setType={setNewType}
								content={newContent} setContent={setNewContent}
								table={newTable} setTable={setNewTable}
							/>
							<div className="form-group">
								<label htmlFor="flashcardCategory">Category</label>
								<select
									id="flashcardCategory"
									value={newCategory}
									onChange={(event) => setNewCategory(event.target.value)}
									required
								>
									<option value="" disabled>
										Select category
									</option>
									{categories.map((category) => (
										<option key={category._id} value={category._id}>
											{category.title}
										</option>
									))}
								</select>
							</div>

							{error && <div className="error-message">{error}</div>}

							<button type="submit" className="submit-button">
								Add Flashcard
							</button>
						</form>
					</div>
				</div>
			)}

			{/* Edit Flashcard Modal */}
			{editModalVisible && (
				<div className="modal-overlay">
					<div className="modal-content">
						<div className="modal-header">
							<h2>Edit Flashcard</h2>
							<button className="exit-button" onClick={closeEditModal}>
								<X size={24} color="#fff" />
							</button>
						</div>
						<form onSubmit={handleEditSubmit} className="modal-form">
							<div className="form-group">
								<label htmlFor="editFlashcardHeader">Header</label>
								<input
									type="text"
									id="editFlashcardHeader"
									value={editHeader}
									onChange={(event) => setEditHeader(event.target.value)}
									autoComplete="off"
									required
								/>
							</div>
							<TableCardFields
								type={editType} setType={setEditType}
								content={editContent} setContent={setEditContent}
								table={editTable} setTable={setEditTable}
							/>
							<div className="form-group">
								<label htmlFor="editFlashcardCategory">Category</label>
								<select
									id="editFlashcardCategory"
									value={editCategory}
									onChange={(event) => setEditCategory(event.target.value)}
									required
								>
									<option value="" disabled>
										Select category
									</option>
									{categories.map((category) => (
										<option key={category._id} value={category._id}>
											{category.title}
										</option>
									))}
								</select>
							</div>

							{error && <div className="error-message">{error}</div>}

							<button type="submit" className="submit-button">
								Save Changes
							</button>
						</form>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{deleteModalVisible && (
				<div className="modal-overlay">
					<div className="modal-content delete-modal-content">
						<div className="modal-header">
							<h2>Confirm Delete</h2>
							<button className="exit-button" onClick={handleDeleteCancel}>
								<X size={24} color="#fff" />
							</button>
						</div>
						<p>Are you sure you want to delete this flashcard?</p>
						<div className="modal-footer">
							<button className="cancel-button" onClick={handleDeleteCancel}>
								Cancel
							</button>
							<button className="confirm-button" onClick={handleDeleteConfirm}>
								Confirm
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export default FlashcardsTray;