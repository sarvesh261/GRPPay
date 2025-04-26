<script>
    import { fade, slide } from 'svelte/transition';
    import { onMount } from 'svelte';

    let balance = 0;
    // @ts-ignore
    /**
     * @type {any[]}
     */
    let items = [];
    // @ts-ignore
    /**
     * @type {any[]}
     */
    let cart = [];
    // @ts-ignore
    let currentUser = null;
    // @ts-ignore
    let currentGroup = null;
    let showPopup = false;
    let popupMessage = '';
    let popupType = '';

    onMount(async () => {
        const userData = localStorage.getItem('user');
        const groupData = localStorage.getItem('currentGroup');
        
        if (userData) {
            currentUser = JSON.parse(userData);
            balance = currentUser.balance;
        }
        
        if (groupData) {
            currentGroup = JSON.parse(groupData);
        }

        // Fetch items from database
        try {
            const response = await fetch('/api/items');
            const data = await response.json();
            if (data.items && Array.isArray(data.items)) {
                items = data.items;
                console.log('Fetched items:', items); // Debug log
            } else {
                console.error('Invalid items data:', data);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        }
    });

    async function handleCheckout() {
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // @ts-ignore
                    groupId: currentGroup.id,
                    // @ts-ignore
                    purchaserId: currentUser.user_id,
                    // @ts-ignore
                    items: cart
                })
            });

            const data = await response.json();
            
            if (data.success) {
                balance = data.newBalance;
                cart = [];
                showNotification('Purchase successful!', 'success');
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Failed to process checkout', 'error');
        }
    }

    // @ts-ignore
    function showNotification(message, type) {
        popupMessage = message;
        popupType = type;
        showPopup = true;
        setTimeout(() => showPopup = false, 3000);
    }

    // @ts-ignore
    function addToCart(item) {
        // @ts-ignore
        cart = [...cart, item];
    }



   // @ts-ignore
     $: totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
</script>

<div class="buy-items">
    <header>
        <div class="header-content" in:fade={{ duration: 500 }}>
            <h1>Buy Items</h1>
            <div class="cart-info">
                <span>Balance: ₹{balance}</span>
                <span>Cart Total: ₹{totalAmount}</span>
                <button class="checkout-btn" on:click={handleCheckout}>Checkout</button>
            </div>
        </div>
    </header>

    <main class="items-grid" in:slide={{ duration: 500 }}>
        {#each items as item (item.id)}
            <div class="item-card" in:fade={{ duration: 300, delay: item.id * 100 }}>
                <h3>{item.name}</h3>
                <p class="price">₹{item.price}</p>
                <button class="add-to-cart" on:click={() => addToCart(item)}>
                    Add to Cart
                </button>
            </div>
        {/each}
    </main>

    {#if cart.length > 0}
        <div class="cart-section" in:slide={{ duration: 300 }}>
            <h2>Cart Items</h2>
            <div class="cart-items">
                {#each cart as item (item.id + Math.random())}
                    <div class="cart-item" in:slide={{ duration: 200 }}>
                        <span>{item.name}</span>
                        <span>₹{item.price}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

{#if showPopup}
    <div class="popup {popupType}" in:fade={{ duration: 300 }} out:fade={{ duration: 300 }}>
        {popupMessage}
    </div>
{/if}

<style>
    .buy-items {
        min-height: 100vh;
        background-color: var(--very-light-beige);
    }

    header {
        background-color: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 1.5rem 0;
        margin-bottom: 2rem;
    }

    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    h1 {
        color: var(--deep-red);
        font-size: 1.8rem;
    }

    .cart-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .items-grid {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
    }

    .item-card {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        text-align: center;
    }

    .item-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .price {
        font-size: 1.2rem;
        color: var(--deep-red);
        font-weight: bold;
        margin: 1rem 0;
    }

    .add-to-cart {
        width: 100%;
        padding: 0.8rem;
        border-radius: 8px;
        background-color: var(--dark-red);
        color: white;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .checkout-btn {
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        background-color: var(--deep-red);
        color: white;
        border: none;
        cursor: pointer;
    }

    .cart-section {
        max-width: 800px;
        margin: 2rem auto;
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .cart-items {
        margin-top: 1rem;
    }

    .cart-item {
        display: flex;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid #eee;
        animation: slideIn 0.3s ease-out;
    }

    .popup {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 8px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }

    .success {
        background-color: #4CAF50;
    }

    .error {
        background-color: #f44336;
    }

    .cart-info {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .cart-info span {
        font-weight: 500;
    }

    .cart-info span:first-child {
        color: var(--deep-red);
        font-weight: bold;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
</style>