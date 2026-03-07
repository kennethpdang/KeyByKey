import React, { useState, useEffect, useRef } from 'react';
import '../cascading_style_sheets/FlashcardsTray.css';
import { useNavigate } from 'react-router-dom';
import TableCardFields from './TableCardFields';

function daysUntil(dateStr) {
    if (!dateStr) {
        return null;                      // not mastered yet
    }
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dateStr);
    due.setHours(0,0,0,0);
    const diffMs = due - today;
    // Positive -> future, 0 -> today, negative -> past
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function renderDue(card) {
    console.log(card)
    const d = daysUntil(card.nextDueAt);
    if (d === null || (card.masteredCount ?? 0) === 0) return "Flashcard Not Yet Mastered";
    const label = d === 1 ? "day" : "days";
    return `${d} ${label} until due`;
}

function getDueStyle(card) {
    const d = daysUntil(card.nextDueAt);
    if (d === null || (card.masteredCount ?? 0) === 0) return {};
    if (d <= 0) return { color: 'red' };       // due today or overdue
    if (d <= 3) return { color: 'yellow' };    // within 3 days
    return {};                                 // default color
}

function getCardDescription(card) {
    if (card.type === 'table') {
        // For table cards, show dimensions and preview
        const table = card.table;
        if (table && table.rows && table.cols) {
            return `Table (${table.rows}×${table.cols})`;
        }
        return 'Table card';
    } else {
        // For text cards, show content preview
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

    // States for delete confirmation modal
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [cardToDelete, setCardToDelete] = useState(null);

    // States for edit modal
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [flashcardToEdit, setFlashcardToEdit] = useState(null);
    const [editHeader, setEditHeader] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editCategory, setEditCategory] = useState("");

    // Keyboard nav (roving tabindex)
    const [focusedIndex, setFocusedIndex] = useState(0);
    const itemRefs = useRef([]);

    // Set type and tables:
    const [newType, setNewType] = useState("text");
    const [newTable, setNewTable] = useState(null);

    // Table edit modal:
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
            setFocusedIndex((i) => (i < flashcards.length ? i : 0));
        }
    }, [isOpen, flashcards.length]);

    const focusItem = (idx) => {
        setFocusedIndex(idx);
        const el = itemRefs.current[idx];
        if (el) {
            el.focus();
        }
    };

    const navigate = useNavigate();

    const onListKeyDown = (event) => {
        if (!flashcards.length) return;
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

    // Fetch categories when the component mounts.
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

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Build request body based on card type
    let body;
    if (newType === "table") {
        // Basic client-side validation for table cards
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
        content: "",          // not used for table cards
        table: newTable,
        collectionName: newCategory, // expect _id string
        };
    } else {
        // Text card
        if (!newContent || !newContent.trim()) {
        setError("Content is required for text cards.");
        return;
        }
        body = {
        header: (newHeader || "").trim(),
        type: "text",
        content: newContent,
        table: null,
        collectionName: newCategory,
        };
    }

    // Common validations
    if (!body.header) {
        setError("Title is required.");
        return;
    }
    if (!body.collectionName) {
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

        // Success: reset form, close, refresh list via parent callback
        setNewHeader("");
        setNewContent("");
        setNewCategory("");
        setNewType("text");
        setNewTable(null);

        closeModal();
        onFlashcardAdded && onFlashcardAdded(json);
    } catch (err) {
        console.error(err);
        setError("Network error creating flashcard.");
    }
    };
    // Delete confirmation modal functions.
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

    // Edit modal functions.
    const openEditModal = (flashcard) => {
        setFlashcardToEdit(flashcard);
        setEditHeader(flashcard.header);
        setEditContent(flashcard.content || "");
        setEditCategory(flashcard.collectionName ? flashcard.collectionName._id : "");

        // NEW: preload type/table
        setEditType(flashcard.type || "text");
        setEditTable(flashcard.table || null);

        setEditModalVisible(true);
    };

    const closeEditModal = () => {
        setEditModalVisible(false);
        setFlashcardToEdit(null);
        setError(null);
        // NEW: reset edit fields
        setEditType("text");
        setEditTable(null);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!flashcardToEdit) return;

        const body = editType === 'table' ? {
            header: editHeader,
            type: 'table',
            content: '',          // table cards don’t use content
            table: editTable,
            collectionName: editCategory
            }
        : {
            header: editHeader,
            type: 'text',
            content: editContent,
            table: null,
            collectionName: editCategory
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
        } catch (err) {
            setError("An unexpected error occurred.");
            console.error(err);
        }
    };

        // Navigate to the memorize page with flashcard id when a flashcard is clicked.
        const handleFlashcardClick = (cardId) => {
            navigate(`/memorize/${cardId}`);
        };

    return (
        <>
        <div className={`tray-container ${isOpen ? 'open' : 'closed'}`}>
            <div className="tray-header">
            <div className="header-left">
                <div className="toggle-icon" onClick={togglePanel}>
                <i className={`fas fa-arrow-circle-down fa-2x ${isOpen ? 'rotate' : 'closed'}`}></i>
                </div>
            </div>
            <div className="header-center">
                {isOpen && <span className="tray-title">Flashcards</span>}
            </div>
            <div className="header-right">
                {isOpen && (
                <div className="add-icon" onClick={handleAddIconClick}>
                    <i className="fas fa-plus fa-2x"></i>
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
                tabIndex={0}  /* allows Tab to move focus into the list itself */
            >
                {flashcards.map((card, i) => (
                    <div className="flashcard-item"
                        key = {card._id}
                        onClick = {() => handleFlashcardClick(card._id)}
                        role = "option"
                        aria-selected = {i === focusedIndex}
                        tabIndex = {i === focusedIndex ? 0 : -1}
                        ref = {(el) => (itemRefs.current[i] = el)}
                        onFocus = { () => setFocusedIndex(i) }
                    >
                        <div className="flashcard-header-container">
                        <div className="flashcard-header"> {card.header} </div>
                        <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button className="edit-button" onClick={() => openEditModal(card)}>
                            <i className="fas fa-pen-to-square"></i>
                            </button>
                            <button className="delete-button" onClick={() => showDeleteConfirmation(card._id)}>
                            <i className="fas fa-trash"></i>
                            </button>
                        </div>
                        </div>
                        <div className="flashcard-category">
                            {card.collectionName && card.collectionName.title}
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
                    <i className="fas fa-times"></i>
                </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label htmlFor="flashcardHeader">Header</label>
                    <input
                    type="text"
                    id="flashcardHeader"
                    value={newHeader}
                    onChange={(e) => setNewHeader(e.target.value)}
                    placeholder="Enter flashcard header/question"
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
                    onChange={(e) => setNewCategory(e.target.value)}
                    required
                    >
                    <option value="" disabled>
                        Select category
                    </option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                        {cat.title}
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
                    <i className="fas fa-times"></i>
                </button>
                </div>
                <form onSubmit={handleEditSubmit} className="modal-form">
                <div className="form-group">
                    <label htmlFor="editFlashcardHeader">Header</label>
                    <input
                    type="text"
                    id="editFlashcardHeader"
                    value={editHeader}
                    onChange={(e) => setEditHeader(e.target.value)}
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
                    onChange={(e) => setEditCategory(e.target.value)}
                    required
                    >
                    <option value="" disabled>
                        Select category
                    </option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                        {cat.title}
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
                    <i className="fas fa-times"></i>
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