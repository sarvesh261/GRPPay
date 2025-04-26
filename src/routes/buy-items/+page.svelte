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

    onMount(async () => {
        // Fetch user and group data from localStorage
        const userData = localStorage.getItem('user');
        const groupData = localStorage.getItem('currentGroup');
        
        if (userData) {
            currentUser = JSON.parse(userData);
            balance = currentUser.balance;
        }
        
        if (groupData) {
            currentGroup = JSON.parse(groupData);
        }

        // Fetch items from the server
        try {
            const response = await fetch('/api/items');
            const data = await response.json();
            if (data.items && Array.isArray(data.items)) {
                // @ts-ignore
                items = data.items.map(item => ({
                    ...item,
                    id: item.item_id // Ensure 'id' is set to a unique property
                }));
            } else {
                console.error('Invalid items data:', data);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        }
    });

    // @ts-ignore
    // @ts-ignore
    function addToCart(item) {
        cart = [...cart, item];
    }

    $: totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);

    async function handleCheckout() {
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // @ts-ignore
                    groupId: currentGroup?.id,
                    // @ts-ignore
                    purchaserId: currentUser?.user_id,
                    items: cart.map(item => ({
                        id: parseInt(item.id, 10),
                        price: parseFloat(item.price),
                        quantity: 1 // Assuming quantity is 1 for simplicity
                    }))
                })
            });

            const data = await response.json();
            
            if (data.success) {
                balance = data.newBalance;
                cart = [];
                showNotification('Thank you! Come again.', 'success', true);
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Failed to process checkout', 'error');
        }
    }

    // @ts-ignore
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

    $: suggestedItems = items.filter(item => parseFloat(item.price) <= balance);

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
    </main></div>

    {#if suggestedItems.length > 0}
    <div class="suggestions-section">
        <h2>Suggestions for You</h2>
        <div class="suggestions-grid">
            {#each suggestedItems as item (item.id)}
                <div class="suggestion-card">
                    <h3>{item.name}</h3>
                    <p>₹{item.price}</p>
                    <button on:click={() => updateCart(item, 1)}>Add to Cart</button>
                </div>
            {/each}
        </div>
    </div>
    {/if}

    {#if cart.length > 0}
    <div class="wrap">
        <div class="cart-section">
            <h2>Cart Items</h2>
            {#each cart as item (item.id)}
                <div class="cart-item">
                    <span>{item.name}</span>
                    <span>₹{item.price}</span>
                </div>
            {/each}
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
    .suggestions-section {
        margin-top: 40px;
        padding: 20px;
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .suggestions-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
    }
    .suggestion-card {
        background-color: white;
        border: 1px solid #ddd;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        text-align: center;
    }
    .suggestion-card button {
        margin-top: 1rem;
        padding: 5px 10px;
        font-size: 1rem;
        color: white;
        background-color: #D84040;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    .suggestion-card button:hover {
        background-color: #B03030;
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
</style>