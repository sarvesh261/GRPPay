<script>
    import { fade, slide } from 'svelte/transition';

    let balance = 1000; // We'll later integrate this with a store or backend
    let showPopup = false;
    let popupMessage = '';
    let popupType = '';

    let items = [
        { id: 1, name: 'Sandwich', price: 45 },
        { id: 2, name: 'Burger', price: 60 },
        { id: 3, name: 'Pizza', price: 120 },
        { id: 4, name: 'French Fries', price: 40 },
        { id: 5, name: 'Cold Coffee', price: 50 },
        { id: 6, name: 'Ice Cream', price: 35 },
        { id: 7, name: 'Pasta', price: 80 },
        { id: 8, name: 'Noodles', price: 70 },
        { id: 9, name: 'Samosa', price: 15 },
        { id: 10, name: 'Tea', price: 12 }
    ];

    // @ts-ignore
    /**
     * @type {any[]}
     */
    let cart = [];

    // @ts-ignore
    function addToCart(item) {
        // @ts-ignore
        cart = [...cart, item];
    }

   // @ts-ignore
     function showNotification(message, type) {
         popupMessage = message;
         popupType = type;
         showPopup = true;
         setTimeout(() => {
             showPopup = false;
         }, 3000);
     }

     function handleCheckout() {
         if (totalAmount <= balance) {
             balance -= totalAmount;
             showNotification('Purchase successful! Your balance has been updated.', 'success');
             cart = [];
         } else {
             showNotification('Not enough balance!', 'error');
         }
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