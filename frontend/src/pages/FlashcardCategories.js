import React, { useState, useRef, useEffect } from 'react';
import '../cascading_style_sheets/FlashcardCategories.css';

const FlashcardCategories = () => {
    // formState.mode can be 'none' | 'add' | 'edit'
    // If in 'edit' mode, formState.category holds the category to update
    const [formState, setFormState] = useState({ mode: 'none', category: null });
    const [categoryHeader, setCategoryHeader] = useState("");
    const [categoryDescription, setCategoryDescription] = useState("");
    const [categories, setCategories] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, category: null });
    const [error, setError] = useState(null);

    const formRef = useRef(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/collections/');
                const data = await response.json();
                if (!response.ok) {
                    setError(data.error || "Failed to fetch categories.");
                } else {
                    setCategories(data);
                }
            } catch (err) {
                setError("An unexpected error occurred while fetching categories.");
            }
        };

        fetchCategories();

        const handleClickOutside = (event) => {
            if (formRef.current && !formRef.current.contains(event.target)) {
                closeForm();
            }
        };

        if (formState.mode !== 'none') {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [formState]);

    useEffect(() => {
        if (formState.mode === 'edit' && formState.category) {
            setCategoryHeader(formState.category.title);
            setCategoryDescription(formState.category.description);
        } else if (formState.mode === 'add') {
            setCategoryHeader("");
            setCategoryDescription("");
        }
    }, [formState]);

    const openAddForm = () => {
        setFormState({ mode: 'add', category: null });
        setError(null);
    };

    const openEditForm = (category) => {
        setFormState({ mode: 'edit', category });
        setError(null);
    };

    const closeForm = () => {
        setFormState({ mode: 'none', category: null });
        setError(null);
    };

    const handleHeaderChange = (e) => {
        setCategoryHeader(e.target.value);
    };

    const handleDescriptionChange = (e) => {
        setCategoryDescription(e.target.value);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (formState.mode === 'edit') {
            // Update category via PATCH
            const updatedCategory = {
                title: categoryHeader,
                description: categoryDescription
            };

            try {
                const response = await fetch(`/api/collections/${formState.category._id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(updatedCategory),
                    headers: { 'Content-Type': 'application/json' },
                });
                const json = await response.json();
                if (!response.ok) {
                    setError(json.error);
                } else {
                    setCategories(prevCategories =>
                        prevCategories.map(cat =>
                            cat._id === json._id ? json : cat
                        )
                    );
                    closeForm();
                }
            } catch (err) {
                setError("An unexpected error occurred.");
            }
        } else {
            // Add new category via POST
            const newCategory = {
                title: categoryHeader,
                description: categoryDescription
            };

            try {
                const response = await fetch('/api/collections/', {
                    method: 'POST',
                    body: JSON.stringify(newCategory),
                    headers: { 'Content-Type': 'application/json' },
                });
                const json = await response.json();
                if (!response.ok) {
                    setError(json.error);
                } else {
                    setCategories(prevCategories => [...prevCategories, json]);
                    closeForm();
                }
            } catch (err) {
                setError("An unexpected error occurred.");
            }
        }
    };

    const handleDeleteClick = (category) => {
        setDeleteConfirm({ open: true, category });
        setError(null);
    };

    const confirmDelete = async () => {
        setError(null);
        try {
            const response = await fetch(`/api/collections/${deleteConfirm.category._id}`, { 
                method: 'DELETE' 
            });
            const json = await response.json();
            if (!response.ok) {
                setError(json.error);
            } else {
                setCategories(prevCategories =>
                    prevCategories.filter(cat => cat._id !== deleteConfirm.category._id)
                );
                setDeleteConfirm({ open: false, category: null });
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ open: false, category: null });
        setError(null);
    };

    return (
        <div className="flashcard-categories-container">
            {error && <div className="error-message">{error}</div>}
            <div className={`flashcard-categories ${formState.mode !== 'none' ? 'shifted' : ''}`}>
                <div className="categories-header">
                    <h2>Flashcard Categories</h2>
                    <button className="add-category-button" onClick={openAddForm}>
                        <i className="fas fa-plus"></i>
                    </button>
                </div>
                <ul>
                    {categories.map((category) => (
                        <li key={category._id}>
                            <div className="category-item">
                                <div className="category-info">
                                    <div className="category-icon">
                                        <i className="fas fa-folder"></i>
                                    </div>
                                    <div className="category-text">
                                        <div className="category-name">{category.title}</div>
                                        <div className="category-description">{category.description}</div>
                                    </div>
                                </div>
                                <div className="category-actions">
                                    <button 
                                        className="update-category-button" 
                                        onClick={() => openEditForm(category)}
                                    >
                                        <i className="fas fa-pen-to-square"></i>
                                    </button>
                                    <button 
                                        className="delete-category-button" 
                                        onClick={() => handleDeleteClick(category)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {formState.mode !== 'none' && (
                <div className="flashcard-category-form" ref={formRef}>
                    <div className="form-header">
                        <h2>{formState.mode === 'edit' ? 'Edit Category' : 'Add New Category'}</h2>
                        <button className="close-form-button" onClick={closeForm}>
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>
                    <form onSubmit={handleFormSubmit}>
                        <div className="form-group">
                            <label htmlFor="categoryHeader">Category Header</label>
                            <input
                                type="text"
                                id="categoryHeader"
                                maxLength="200"
                                value={categoryHeader}
                                onChange={handleHeaderChange}
                                placeholder="Enter category title"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="categoryDescription">Category Description</label>
                            <textarea
                                id="categoryDescription"
                                maxLength="750"
                                value={categoryDescription}
                                onChange={handleDescriptionChange}
                                placeholder="Enter category description"
                            />
                            <div className={`char-count ${categoryDescription.length >= 600 ? 'warning' : ''}`}>
                                {categoryDescription.length}/750
                            </div>
                        </div>
                        <button type="submit" className="submit-button">
                            {formState.mode === 'edit' ? 'Update Category' : 'Add Category'}
                        </button>
                    </form>
                </div>
            )}
            {deleteConfirm.open && (
                <div className="modal-overlay">
                    <div className="modal-content delete-modal-content">
                        <div className="modal-header">
                            <h2>Confirm Delete</h2>
                            <button className="exit-button" onClick={cancelDelete}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <p>Are you sure you want to delete this category?</p>
                        <div className="modal-footer">
                            <button className="cancel-button" onClick={cancelDelete}>Cancel</button>
                            <button className="confirm-button" onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashcardCategories;