<script>
    import { onMount } from 'svelte';

    // @ts-ignore
    /**
     * @type {any[]}
     */
    let items = [];
    /**
     * @type {any[]}
     */
    let cart = [];
    let balance = 0;
    // @ts-ignore
    let currentUser = null;
    // @ts-ignore
    let currentGroup = null;
    let showPopup = false;
    let popupMessage = '';
    let popupType = '';

    // New variables for suggestions
    /**
     * @type {any[]}
     */
    // @ts-ignore
    let suggestedItems = [];
    // @ts-ignore
    let showSuggestions = true;

    // Add new variable for affordable items
    /**
     * @type {any[]}
     */
    let affordableItems = [];

    onMount(async () => {
        // Fetch user and group data from localStorage
        const userData = localStorage.getItem('user');
        const groupData = localStorage.getItem('currentGroup');
        
        if (userData) {
            try {
                currentUser = JSON.parse(userData);
                // Ensure balance is a number
                balance = Number(currentUser.balance) || 0;
                console.log('Loaded user data:', currentUser);
                console.log('Current balance:', balance);
            } catch (e) {
                console.error('Error parsing user data:', e);
                showNotification('Error loading user data', 'error');
            }
        }
        
        if (groupData) {
            try {
                currentGroup = JSON.parse(groupData);
            } catch (e) {
                console.error('Error parsing group data:', e);
            }
        }

        // Fetch items from the server
        try {
            const response = await fetch('/api/items');
            const data = await response.json();
            if (data.items && Array.isArray(data.items)) {
                // @ts-ignore
                items = data.items.map(item => ({
                    ...item,
                    id: item.item_id, // Ensure 'id' is set to a unique property
                    price: Number(item.price) // Ensure price is a number
                }));
                
                // Generate suggestions based on balance
                generateSuggestions();
                
                // Find affordable items
                updateAffordableItems();
            } else {
                console.error('Invalid items data:', data);
                showNotification('Failed to load items', 'error');
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
            showNotification('Failed to connect to server', 'error');
        }
    });

    // Update affordable items whenever balance changes
   // @ts-ignore
     $: {
        if (items.length > 0 && balance > 0) {
            updateAffordableItems();
        }
    }

    // Function to update affordable items
    function updateAffordableItems() {
        affordableItems = items.filter(item => Number(item.price) <= balance)
            .sort((a, b) => Number(a.price) - Number(b.price));
    }

    // Calculate total amount with proper number handling
    $: totalAmount = cart.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        return sum + (price * quantity);
    }, 0);

    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    function addToCart(item) {
        cart = [...cart, item];
    }

    async function handleCheckout() {
        try {
            if (cart.length === 0) {
                showNotification('Your cart is empty', 'error');
                return;
            }

            if (totalAmount > balance) {
                showNotification('Insufficient balance', 'error');
                return;
            }

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // @ts-ignore
                    groupId: currentGroup?.id,
                    // @ts-ignore
                    userId: currentUser?.user_id,
                    items: cart.map(item => ({
                        id: parseInt(item.id, 10),
                        price: parseFloat(item.price),
                        quantity: item.quantity || 1
                    })),
                    totalAmount: totalAmount
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Show success message and redirect to login page
                showNotification('Thank you for using GRPPay! Your purchase was successful.', 'success', true);
                
                // Clear cart and user data
                cart = [];
                localStorage.removeItem('user');
                localStorage.removeItem('currentGroup');
                
                // Redirect will happen after the notification (in showNotification function)
            } else {
                showNotification(data.message || 'Checkout failed', 'error');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            showNotification('Failed to process checkout', 'error');
        }
    }

    /**
     * @param {string} message
     * @param {string} type
     */
    function showNotification(message, type, redirect = false) {
        popupMessage = message;
        popupType = type;
        showPopup = true;
        setTimeout(() => {
            showPopup = false;
            if (redirect) {
                window.location.href = '/'; // Redirect to login page
            }
        }, 3000);
    }

    function logout() {
        // Clear user data and redirect to the starting page
        localStorage.removeItem('user');
        localStorage.removeItem('currentGroup');
        window.location.href = '/';
    }

    // @ts-ignore
    function removeFromCart(item) {
        cart = cart.filter(cartItem => cartItem.id !== item.id);
    }

    // @ts-ignore
    function updateCart(item, quantity) {
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            existingItem.quantity += quantity;
            if (existingItem.quantity <= 0) {
                cart = cart.filter(cartItem => cartItem.id !== item.id);
            }
        } else if (quantity > 0) {
            cart = [...cart, { ...item, quantity }];
        }
    }

    // Update variables for suggestions to handle multiple combinations
    /**
     * @type {any[][]}
     */
    let suggestedCombinations = [];
    // @ts-ignore
// showSuggestions is already declared above, so we can remove this duplicate declaration

    // Function to generate suggestions based on balance
    function generateSuggestions() {
        // Sort items by price (ascending)
        const sortedItems = [...items].sort((a, b) => a.price - b.price);
        
        // Filter items that are within budget
        const affordableItems = sortedItems.filter(item => item.price <= balance);
        
        // Find best combinations if there are enough items
        if (affordableItems.length > 3) {
            // Find multiple combinations that would use the budget efficiently
            suggestedCombinations = findMultipleCombinations(sortedItems, balance, 3);
        } else {
            suggestedCombinations = [affordableItems];
        }
    }
    
    // Function to find multiple good combinations of items within budget
    /**
     * @param {any[]} items
     * @param {number} maxBudget
     * @param {number} numCombinations
     */
    function findMultipleCombinations(items, maxBudget, numCombinations) {
        // Array to store our best combinations
        /**
         * @type {any[][]}
         */
        let bestCombinations = [];
        
        // First find the best overall combination
        const bestOverall = findBestCombination(items, maxBudget);
        if (bestOverall.length > 0) {
            bestCombinations.push(bestOverall);
        }
        
        // Find a combination that maximizes item count
        const maxItemsCombo = findMaxItemsCombo(items, maxBudget);
        if (maxItemsCombo.length > 0 && !areCombinationsEqual(maxItemsCombo, bestOverall)) {
            bestCombinations.push(maxItemsCombo);
        }
        
        // Find a combination with the most expensive item
        const expensiveCombo = findComboWithExpensiveItem(items, maxBudget);
        if (expensiveCombo.length > 0 && 
            !areCombinationsEqual(expensiveCombo, bestOverall) && 
            !areCombinationsEqual(expensiveCombo, maxItemsCombo)) {
            bestCombinations.push(expensiveCombo);
        }
        
        // If we still need more combinations, generate some random valid ones
        while (bestCombinations.length < numCombinations) {
            const randomCombo = findRandomCombo(items, maxBudget);
            if (randomCombo.length > 0 && !combinationExists(randomCombo, bestCombinations)) {
                bestCombinations.push(randomCombo);
            }
        }
        
        return bestCombinations;
    }
    
    /**
     * @param {any[]} combo1
     * @param {any[]} combo2
     */
    function areCombinationsEqual(combo1, combo2) {
        if (combo1.length !== combo2.length) return false;
        
        const ids1 = combo1.map(item => item.id).sort().join(',');
        const ids2 = combo2.map(item => item.id).sort().join(',');
        
        return ids1 === ids2;
    }
    
    /**
     * @param {any[]} combo
     * @param {any[][]} existingCombos
     */
    function combinationExists(combo, existingCombos) {
        return existingCombos.some(existingCombo => areCombinationsEqual(combo, existingCombo));
    }
    
    /**
     * @param {any[]} items
     * @param {number} maxBudget
     */
    function findBestCombination(items, maxBudget) {
        // Simple algorithm to find combinations that use budget efficiently
        let bestValue = 0;
        /**
         * @type {any[]}
         */
        let bestCombination = [];
        
        // Try combinations of 2-3 items
        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                const total = items[i].price + items[j].price;
                if (total <= maxBudget && total > bestValue) {
                    bestValue = total;
                    bestCombination = [items[i], items[j]];
                }
                
                // Try adding a third item
                for (let k = j + 1; k < items.length; k++) {
                    const totalWith3 = items[i].price + items[j].price + items[k].price;
                    if (totalWith3 <= maxBudget && totalWith3 > bestValue) {
                        bestValue = totalWith3;
                        bestCombination = [items[i], items[j], items[k]];
                    }
                }
            }
        }
        
        return bestCombination;
    }
    
    /**
     * @param {any[]} items
     * @param {number} maxBudget
     */
    function findMaxItemsCombo(items, maxBudget) {
        // Sort by price (ascending)
        const sortedItems = [...items].sort((a, b) => a.price - b.price);
        
        /**
         * @type {any[]}
         */
        let combo = [];
        let total = 0;
        
        // Add as many items as possible, starting from the cheapest
        for (const item of sortedItems) {
            if (total + item.price <= maxBudget) {
                combo.push(item);
                total += item.price;
            }
            
            // Limit to 5 items max for UI purposes
            if (combo.length >= 5) break;
        }
        
        return combo;
    }
    
    /**
     * @param {any[]} items
     * @param {number} maxBudget
     */
    function findComboWithExpensiveItem(items, maxBudget) {
        // Sort by price (descending)
        const sortedItems = [...items].sort((a, b) => b.price - a.price);
        
        // Find the most expensive item that fits in the budget
        const expensiveItem = sortedItems.find(item => item.price <= maxBudget);
        if (!expensiveItem) return [];
        
        /**
         * @type {any[]}
         */
        let combo = [expensiveItem];
        let remaining = maxBudget - expensiveItem.price;
        
        // Add more items if possible
        for (const item of sortedItems) {
            // Skip the item we already added
            if (item.id === expensiveItem.id) continue;
            
            if (item.price <= remaining) {
                combo.push(item);
                remaining -= item.price;
                
                // Limit to 3 items for UI purposes
                if (combo.length >= 3) break;
            }
        }
        
        return combo;
    }
    
    /**
     * @param {any[]} items
     * @param {number} maxBudget
     */
    function findRandomCombo(items, maxBudget) {
        // Shuffle the items
        const shuffledItems = [...items].sort(() => Math.random() - 0.5);
        
        /**
         * @type {any[]}
         */
        let combo = [];
        let total = 0;
        
        // Add random items that fit in the budget
        for (const item of shuffledItems) {
            if (total + item.price <= maxBudget) {
                combo.push(item);
                total += item.price;
                
                // Limit to 3-4 items for UI purposes
                if (combo.length >= 3 + Math.floor(Math.random() * 2)) break;
            }
        }
        
        return combo;
    }

    // Add the function to add a specific combination to cart
    /**
     * @param {any[]} combination
     */
    function addCombinationToCart(combination) {
        combination.forEach(item => {
            updateCart(item, 1);
        });
        showNotification('Combination added to cart!', 'success');
    }
</script>

<div class="buy-items">
    <header>
        <h1 class="title">Buy Items</h1>
        <div class="cart-info">
            <span class="balance">Balance: ₹{balance}</span>
            <span class="cart-total">Cart Total: ₹{totalAmount}</span>
            <button class="checkout-btn" on:click={handleCheckout}>Checkout</button>
            <button class="logout-btn" on:click={logout}>Logout</button>
        </div>
    </header>
    
    <!-- Updated suggestions section to show multiple combinations -->
    {#if showSuggestions && suggestedCombinations.length > 0}
        <div class="suggestions-container">
            <div class="suggestions-header">
                <h2>Best Combos Within Your Budget</h2>
                <button class="close-btn" on:click={() => showSuggestions = false}>×</button>
            </div>
            
            <div class="combinations-wrapper">
                {#each suggestedCombinations as combination, index}
                    {#if combination.length > 0}
                        <div class="combination-card">
                            <h3>Combo {index + 1}</h3>
                            <p class="combo-total">
                                Total: ₹{combination.reduce((sum, item) => sum + Number(item.price), 0).toFixed(2)}
                            </p>
                            <div class="combo-items">
                                {#each combination as item}
                                    <div class="combo-item">
                                        <span class="item-name">{item.name}</span>
                                        <span class="item-price">₹{item.price}</span>
                                    </div>
                                {/each}
                            </div>
                            <button class="add-combo-btn" on:click={() => addCombinationToCart(combination)}>
                                Add to Cart
                            </button>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
    
    <!-- New section: Products within your budget -->
    {#if affordableItems.length > 0}
        <div class="affordable-container">
            <div class="affordable-header">
                <h2>Products Within ₹{balance}</h2>
                <p>Choose from {affordableItems.length} affordable options</p>
            </div>
            <div class="affordable-items">
                {#each affordableItems as item (item.id)}
                    <div class="affordable-item">
                        <h3>{item.name}</h3>
                        <p class="price">₹{item.price}</p>
                        <button class="add-btn" on:click={() => updateCart(item, 1)}>
                            <span class="icon">+</span> Add to Cart
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
    
    <div class="wrap">
        <main class="items-grid">
            {#each items as item (item.id)}
                <div class="item-card">
                    <h3>{item.name}</h3>
                    <p>₹{item.price}</p>
                    <div class="button-group">
                        <button on:click={() => updateCart(item, -1)}>-</button>
                        <span>{cart.find(cartItem => cartItem.id === item.id)?.quantity || 0}</span>
                        <button on:click={() => updateCart(item, 1)}>+</button>
                    </div>
                </div>
            {/each}
        </main>
    </div>

    <!-- Single cart section -->
    <!-- Single cart section - updated to table format -->
    {#if cart.length > 0}
    <div class="wrap">
        <div class="cart-section">
            <h2>Cart Items</h2>
            <div class="cart-table-container">
                <table class="cart-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each cart as item (item.id)}
                            <tr class="cart-row">
                                <td>{item.name}</td>
                                <td>
                                    <div class="quantity-control">
                                        <button class="qty-btn" on:click={() => updateCart(item, -1)}>-</button>
                                        <span>{item.quantity || 1}</span>
                                        <button class="qty-btn" on:click={() => updateCart(item, 1)}>+</button>
                                    </div>
                                </td>
                                <td>₹{item.price}</td>
                                <td>₹{(Number(item.price) * (item.quantity || 1)).toFixed(2)}</td>
                                <td>
                                    <button class="remove-btn" on:click={() => removeFromCart(item)}>
                                        <span class="remove-icon">×</span>
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <div class="cart-total-section">
                <h3>Total: ₹{totalAmount.toFixed(2)}</h3>
                <button class="checkout-btn cart-checkout" on:click={handleCheckout}>Proceed to Checkout</button>
            </div>
        </div>
    </div>
    {/if}
    {#if showPopup}
        <div class="popup {popupType} centered">
            {popupMessage}
        </div>
    {/if}
</div>

<style>
        .cart-section {
        align-items: center;
        align-self: center;
        margin-top: 20px;
        padding: 25px;
        width: 90%; /* Updated from 80% to 90% to match other containers */
        max-width: 100%; /* Added max-width to match other containers */
        margin-top: 3rem;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .cart-section h2 {
        color: var(--deep-red);
        font-size: 1.8rem;
        margin-bottom: 20px;
        text-align: center;
        position: relative;
    }
    
    .cart-section h2::after {
        content: "";
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 3px;
        background-color: var(--deep-red);
        border-radius: 3px;
    }
    
    .cart-table-container {
        overflow-x: auto;
        margin-bottom: 20px;
    }
    
    .cart-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }
    
    .cart-table thead {
        background-color: var(--light-beige);
    }
    
    .cart-table th {
        padding: 12px 15px;
        text-align: left;
        font-weight: bold;
        color: #333;
        border-bottom: 2px solid var(--deep-red);
    }
    
    .cart-table td {
        padding: 12px 15px;
        border-bottom: 1px solid #eee;
        vertical-align: middle;
    }
    
    .cart-row {
        transition: background-color 0.2s;
    }
    
    .cart-row:hover {
        background-color: #f9f9f9;
    }
    
    .cart-row:last-child td {
        border-bottom: none;
    }
    
    .quantity-control {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
    }
    
    .qty-btn {
        width: 28px;
        height: 28px;
        background-color: var(--deep-red);
        color: white;
        border: none;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;
    }
    
    .qty-btn:hover {
        background-color: var(--dark-red);
    }
    
    .qty-btn:active {
        transform: scale(0.95);
    }
    
    .remove-btn {
        background-color: #f44336;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.3s, transform 0.2s;
    }
    
    .remove-btn:hover {
        background-color: #d32f2f;
        transform: scale(1.1);
    }
    
    .remove-icon {
        font-size: 18px;
        font-weight: bold;
    }
    
    .cart-total-section {
        margin-top: 25px;
        padding-top: 15px;
        border-top: 2px dashed #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .cart-total-section h3 {
        font-size: 1.5rem;
        color: #333;
        font-weight: bold;
    }
    
    .cart-checkout {
        padding: 12px 20px;
        font-size: 1.1rem;
    }
    .buy-items {
        padding: 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        align-items: center;
        background-color: #F8F2DE; /* Soft background color */
    }
    .title {
        font-size: 3rem; /* Larger font size */
        color: #000000; /* Darker color for contrast */
        text-align: center;
        margin-bottom: 30px; /* More space below title */
        font-weight: bold; /* Bold text */
    }
    .cart-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px; /* More space below cart info */
        padding: 10px;
        background-color: var(--light-beige); /* Light background for cart info */
        border-radius: 8px; /* Rounded corners */
    }
    .balance, .cart-total {
        font-size: 1.5rem; /* Larger font size */
        color: #000000; /* Darker color for text */
    }
    .checkout-btn, .logout-btn {
        padding: 12px 24px; /* Larger button size */
        font-size: 1.2rem; /* Larger font size */
        color: white;
        background-color: #D84040; /* Blue color for buttons */
        border: none;
        border-radius: 8px; /* Rounded corners */
        cursor: pointer;
        transition: background-color 0.3s, transform 0.3s;
    }
    .checkout-btn:hover, .logout-btn:hover {
        background-color: #D84040; /* Darker blue on hover */
        transform: scale(1.05); /* Slightly larger on hover */
    }
    .wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        align-self: center; 
    }
    .items-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr); /* 3 items per row */
        gap: 40px; /* Reduced gap for tighter layout */
        margin-top: 20px;
    }
    .item-card {
        background-color: white;
        border: 1px solid #ddd;
        padding: 5rem; /* Adjusted padding */
        border-radius: 12px; /* Rounded corners */
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Enhanced shadow */
        transition: transform 0.3s, box-shadow 0.3s;
        text-align: center; /* Centered text */
        height: 25vh; /* Fixed height to make it square */
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .item-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2); /* Enhanced shadow on hover */
    }
    .button-group {
        display: flex;
        justify-content: space-around;
        align-items: center;
        margin-top: 1rem;
    }
    .button-group button {
        padding: 5px 10px;
        font-size: 1rem;
        color: white;
        background-color: #D84040;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    .button-group button:hover {
        background-color: #B03030;
    }
    .cart-section {
        align-items: center;
        align-self: center;
        margin-top: 20px;
        padding: 20px;
        width: 30vw;
        margin-top: 5rem;
        background-color: #ffffff; /* Light background color */
        border: 1px solid #ddd; /* Light border */
        border-radius: 8px; /* Rounded corners */
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow */
    }
    .popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px;
        background-color: #333;
        color: #fff;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        text-align: center;
    }
    .success {
        background-color: #4CAF50;
    }
    .error {
        background-color: #f44336;
    }

    /* New styles for suggestions */
    .suggestions-container {
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin: 20px auto;
        padding: 20px;
        max-width: 90%;
        position: relative;
    }
    
    .suggestions-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 15px;
        position: relative;
    }
    
    .suggestions-header h2 {
        color: var(--deep-red);
        margin-bottom: 5px;
    }
    
    .suggestions-items {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        justify-content: center;
    }
    
    .suggestion-item {
        background-color: var(--light-beige);
        border-radius: 8px;
        padding: 15px;
        width: 200px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
    }
    
    .suggestion-item:hover {
        transform: translateY(-5px);
    }
    
    .suggestion-item h3 {
        margin-top: 0;
        color: #333;
    }
    
    .suggestion-item button {
        background-color: var(--dark-red);
        color: white;
        border: none;
        border-radius: 5px;
        padding: 8px 12px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    .suggestion-item button:hover {
        background-color: #B03030;
    }
    
    .add-all-btn {
        background-color: var(--deep-red);
        color: white;
        border: none;
        border-radius: 5px;
        padding: 10px 15px;
        margin-top: 10px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s;
    }
    
    .add-all-btn:hover {
        background-color: #B03030;
    }
    
    .close-btn {
        position: absolute;
        top: 0;
        right: 0;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    }
    
    .close-btn:hover {
        color: #333;
    }

    /* Add styles for the improved cart items */
    .cart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        margin-bottom: 10px;
        background-color: #f9f9f9;
        border-radius: 5px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .cart-item span {
        margin-right: 10px;
    }
    
    .remove-btn {
        background-color: #D84040;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    .remove-btn:hover {
        background-color: #B03030;
    }
    
    .cart-total-section {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #ddd;
        text-align: right;
    }
    
    /* Fix CSS variable definitions */
    :root {
        --deep-red: #D84040;
        --dark-red: #B03030;
        --light-beige: #F8F2DE;
    }
    
    /* Adjust suggestion item styles to match the theme */
    .suggestion-item {
        background-color: #F8F2DE;
        border-radius: 8px;
        padding: 15px;
        width: 200px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
    }
    
    .suggestion-item button {
        background-color: #D84040;
        color: white;
        border: none;
        border-radius: 5px;
        padding: 8px 12px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    .add-all-btn {
        background-color: #D84040;
        color: white;
        border: none;
        border-radius: 5px;
        padding: 10px 15px;
        margin-top: 10px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s;
    }

    /* Styles for affordable items section */
    .affordable-container {
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin: 20px auto;
        padding: 20px;
        max-width: 90%;
    }
    
    .affordable-header {
        text-align: center;
        margin-bottom: 20px;
    }
    
    .affordable-header h2 {
        color: var(--deep-red);
        margin-bottom: 5px;
        font-size: 1.8rem;
    }
    
    .affordable-header p {
        color: #666;
        font-size: 1.1rem;
    }
    
    .affordable-items {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        justify-content: center;
    }
    
    .affordable-item {
        background-color: #F8F2DE;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 150px;
    }
    
    .affordable-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    .affordable-item h3 {
        margin-top: 0;
        color: #333;
        font-size: 1.2rem;
    }
    
    .affordable-item .price {
        font-size: 1.3rem;
        font-weight: bold;
        color: var(--deep-red);
        margin: 10px 0;
    }
    
    .affordable-item .add-btn {
        background-color: var(--deep-red);
        color: white;
        border: none;
        border-radius: 5px;
        padding: 8px 12px;
        cursor: pointer;
        transition: background-color 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: auto;
    }
    
    .affordable-item .add-btn:hover {
        background-color: var(--dark-red);
    }
    
    .affordable-item .icon {
        margin-right: 5px;
        font-weight: bold;
    }
/* Updated styles for multiple combinations */
.combinations-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    justify-content: center;
    margin-top: 15px;
}

.combination-card {
    background-color: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
    border: 2px solid var(--light-beige);
    display: flex;
    flex-direction: column;
    height: 100%;
}

.combination-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
    border-color: var(--deep-red);
}

.combination-card h3 {
    color: var(--deep-red);
    margin-top: 0;
    margin-bottom: 10px;
    text-align: center;
    font-size: 1.4rem;
    font-weight: bold;
    padding-bottom: 8px;
    border-bottom: 2px dashed var(--light-beige);
}

.combo-total {
    text-align: center;
    font-weight: bold;
    font-size: 1.3rem;
    margin-bottom: 15px;
    color: #333;
    background-color: var(--light-beige);
    padding: 8px;
    border-radius: 6px;
}

.combo-items {
    margin-bottom: 15px;
    max-height: 180px;
    overflow-y: auto;
    flex-grow: 1;
    scrollbar-width: thin;
    scrollbar-color: var(--deep-red) var(--light-beige);
}

.combo-items::-webkit-scrollbar {
    width: 6px;
}

.combo-items::-webkit-scrollbar-track {
    background: var(--light-beige);
    border-radius: 10px;
}

.combo-items::-webkit-scrollbar-thumb {
    background-color: var(--deep-red);
    border-radius: 10px;
}

.combo-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    margin-bottom: 8px;
    background-color: #f9f9f9;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.combo-item:hover {
    background-color: var(--light-beige);
}
</style>