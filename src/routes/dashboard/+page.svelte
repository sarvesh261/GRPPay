<script>
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    import { fade, slide, scale } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    // @ts-ignore
    import QRCode from 'qrcode';

    let balance = 0;
    // @ts-ignore
    /**
     * @type {any[]}
     */
    let members = [];
    let newMember = { username: '', password: '' };
    let showCard = false;
    // @ts-ignore
    /**
     * @type {{ balance: number; user_id: any; } | null}
     */
    let currentUser = null;
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    let error = '';
    // @ts-ignore
    let successMessage = '';
    // @ts-ignore
    let showSuccessPopup = false;
    
    // Variables for balance update
    let showUpdateBalanceForm = false;
    let amountToAdd = 0;
    let qrCodeDataUrl = '';

    onMount(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            currentUser = JSON.parse(userData);
            // @ts-ignore
            balance = currentUser.balance;
        }
    });

    async function addMember() {
        try {
            const response = await fetch('/api/verify-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMember)
            });

            const data = await response.json();
            if (data.success) {
                // @ts-ignore
                members = [...members, { username: newMember.username }];
                newMember = { username: '', password: '' };
                error = '';
            } else {
                error = 'Invalid member credentials';
            }
        } catch (err) {
            error = 'Failed to add member';
        }
    }

    async function proceedToBuyItems() {
        try {
            const response = await fetch('/api/update-balances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // @ts-ignore
                    creator: currentUser.user_id,
                    // @ts-ignore
                    members: members.map(m => m.username)
                })
            });

            const data = await response.json();
            if (data.success) {
                balance = data.newBalance;
                // @ts-ignore
                currentUser = { ...currentUser, balance: data.newBalance };
                localStorage.setItem('user', JSON.stringify(currentUser));
                localStorage.setItem('currentGroup', JSON.stringify(data.group));
                
                // Show success message
                successMessage = `Balances updated! Your new balance: ₹${data.newBalance}`;
                showSuccessPopup = true;
                
                // Navigate after a short delay
                setTimeout(() => {
                    goto('/buy-items');
                }, 1500);
            } else {
                error = data.message || 'Failed to update balances';
            }
        } catch (err) {
            error = 'Failed to update balances and create group';
        }
    }

    function createGroup() {
        showCard = true;
    }

    function goToBuyItems() {
        goto('/buy-items');
    }

    function updateBalance() {
        showUpdateBalanceForm = true;
    }
    
    function generateQRCode() {
        const paymentData = `upi://pay?pa=example@upi&pn=User&am=${amountToAdd}&cu=INR`;
        QRCode.toDataURL(paymentData, (/** @type {any} */ err, /** @type {string} */ url) => {
            if (err) {
                console.error('Failed to generate QR code', err);
            } else {
                qrCodeDataUrl = url;
            }
        });
    }
    
    async function confirmPayment() {
        try {
            // Update balance in the database
            const response = await fetch('/api/update-user-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // @ts-ignore
                    user_id: currentUser.user_id,
                    amount_to_add: Number(amountToAdd) // Ensure it's a number
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update local balance
                balance = Number(data.new_balance);
                // Update currentUser object
                // @ts-ignore
                currentUser = { ...currentUser, balance: Number(data.new_balance) };
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                // Reset form
                amountToAdd = 0;
                qrCodeDataUrl = '';
                showUpdateBalanceForm = false;
                
                // Show success message
                successMessage = `Payment confirmed! Your new balance: ₹${data.new_balance}`;
                showSuccessPopup = true;
                
                // Navigate to buy items page after a short delay
                setTimeout(() => {
                    goto('/buy-items');
                }, 1500);
            } else {
                error = data.message || 'Failed to update balance';
                console.error('Error from server:', data.message);
            }
        } catch (err) {
            error = 'Failed to update balance';
            console.error('Error updating balance:', err);
        }
    }
</script>

<div class="dashboard">
  <header>
    <div class="header-content" in:fade={{ duration: 500 }}>
      <h1>Dashboard</h1>
      <div class="user-info">
        <span class="username">Welcome, {currentUser?.user_id}</span>
        <span class="balance">₹{balance}</span>
      </div>
    </div>
  </header>

  <main class="dashboard-content">
    <div class="welcome-section" in:slide={{ duration: 500 }}>
      <h2>Create a New Group</h2>
      <p>Start managing expenses with your friends</p>
      <button class="create-group" on:click={createGroup}>Create Group</button>
    </div>
    
    {#if showCard}
      <div class="card" 
          in:slide={{ duration: 400, delay: 300 }}
          out:slide={{ duration: 300 }}>
        <div class="card-header">
          <h2>Add Group Members</h2>
          <p>Add members to share expenses with</p>
        </div>

        <div class="member-form">
          <div class="input-group">
            <input
              type="text"
              placeholder="Username"
              bind:value={newMember.username}
            />
            <input
              type="password"
              placeholder="Password"
              bind:value={newMember.password}
            />
            <button class="add-btn" on:click={addMember}>Add Member</button>
          </div>
        </div>

        {#if members.length > 0}
          <div class="members-list">
            <h3>Added Members</h3>
            {#each members as member (member.username)}
              <div class="member-card" in:slide={{ duration: 300 }}>
                <span>{member.username}</span>
              </div>
            {/each}
          </div>
          <button class="proceed" in:fade on:click={proceedToBuyItems}>Proceed</button>
        {/if}
      </div>
    {/if}
    <div class="update-balance-section" in:slide={{ duration: 500 }}>
        <h2>Update Balance</h2>
        <p>Keep your balance up to date</p>
        
        {#if !showUpdateBalanceForm}
            <button class="update-balance-btn" on:click={updateBalance}>Update Balance</button>
        {:else}
            <div class="balance-form" in:slide={{ duration: 300 }}>
                <div class="input-group">
                    <input 
                        type="number" 
                        placeholder="Enter amount to add" 
                        bind:value={amountToAdd}
                        min="1"
                    />
                    <button class="generate-qr-btn" on:click={generateQRCode}>Generate QR Code</button>
                </div>
                
                {#if qrCodeDataUrl}
                    <div class="qr-code-container" in:fade={{ duration: 300 }}>
                        <img src={qrCodeDataUrl} alt="Payment QR Code" class="qr-code" />
                        <p class="payment-instructions">Scan this QR code to make payment</p>
                        <button class="confirm-payment-btn" on:click={confirmPayment}>Confirm Payment</button>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
    
    <button class="buy-items-btn" on:click={goToBuyItems}>Buy Items</button>
    
    {#if showSuccessPopup}
        <div class="success-popup" in:scale={{ duration: 300, start: 0.8 }}>
            <p>{successMessage}</p>
        </div>
    {/if}
  </main>
</div>

<style>
  .dashboard {
    min-height: 100vh;
    background-color: var(--very-light-beige);
  }

  header {
    background-color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1.5rem 0;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    animation: slideDown 0.5s ease-out;
  }

  .welcome-section {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: fadeIn 0.5s ease-out;
  }

  .card {
    animation: slideUp 0.5s ease-out;
  }

  .member-card {
    transition: all 0.3s ease;
  }

  .member-card:hover {
    transform: translateX(5px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  button {
    transition: all 0.3s ease;
  }

  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  input {
    transition: all 0.3s ease;
  }

  input:focus {
    transform: scale(1.01);
  }

  @keyframes slideDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .balance {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--deep-red);
  }

  .dashboard-content {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 2rem;
  }

  .card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    margin-top: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    /* Remove the slideUp animation since we're using Svelte's slide transition */
    
        animation: none;
    
  }

  .card-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .card-header h2 {
    color: var(--deep-red);
    margin-bottom: 0.5rem;
  }

  .card-header p {
    color: #666;
  }

  .member-form {
    margin-bottom: 2rem;
  }

  .input-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .input-group input {
    flex: 1;
    min-width: 200px;
    padding: 0.8rem;
    border-radius: 8px;
    border: 1px solid #ddd;
  }

  .add-btn {
    min-width: 120px;
    padding: 0.8rem;
    border-radius: 8px;
    background-color: var(--dark-red);
    color: white;
    border: none;
    cursor: pointer;
  }

  .members-list {
    margin: 2rem 0;
  }

  .member-card {
    padding: 1rem;
    background: var(--light-beige);
    border-radius: 8px;
    margin: 0.5rem 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .proceed {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    border-radius: 8px;
    background-color: var(--deep-red);
    color: white;
    border: none;
    cursor: pointer;
  }

  h1 {
    color: var(--deep-red);
    font-size: 1.8rem;
  }

  .username {
    color: #666;
    font-size: 1.1rem;
  }

  .create-group {
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 8px;
    background-color: var(--dark-red);
    color: white;
    border: none;
    margin: 1rem;
    cursor: pointer;
  }

  .buy-items-btn {
      padding: 1rem 2rem;
      font-size: 1.1rem;
      border-radius: 8px;
      background-color: var(--dark-red);
      color: white;
      border: none;
      cursor: pointer;
      margin-top: 2rem;
      transition: background-color 0.3s, transform 0.3s;
      display: block; /* Make the button a block element */
      margin-left: auto; /* Center horizontally */
      margin-right: auto; /* Center horizontally */
  }

  .buy-items-btn:hover {
      background-color: #B03030;
      transform: scale(1.05);
  }
  .update-balance-section {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-top: 2rem;
      animation: fadeIn 0.5s ease-out;
  }

  .update-balance-btn {
      padding: 1rem 2rem;
      font-size: 1.1rem;
      border-radius: 8px;
      background-color: var(--dark-red);
      color: white;
      border: none;
      cursor: pointer;
      margin-top: 1rem;
      transition: background-color 0.3s, transform 0.3s;
  }

  .update-balance-btn:hover {
      background-color: #B03030;
      transform: scale(1.05);
  }

  .balance-form {
      margin-top: 1.5rem;
  }
  
  .qr-code-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 2rem;
  }
  
  .qr-code {
      width: 200px;
      height: 200px;
      margin-bottom: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 0.5rem;
      background: white;
  }
  
  .payment-instructions {
      margin-bottom: 1.5rem;
      color: #666;
  }
  
  .generate-qr-btn {
      min-width: 150px;
      padding: 0.8rem;
      border-radius: 8px;
      background-color: var(--dark-red);
      color: white;
      border: none;
      cursor: pointer;
  }
  
  .confirm-payment-btn {
      padding: 1rem 2rem;
      font-size: 1.1rem;
      border-radius: 8px;
      background-color: var(--deep-red);
      color: white;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
  }
  
  .confirm-payment-btn:hover {
      background-color: #B03030;
      transform: scale(1.05);
  }
  
  .success-popup {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background-color: #4CAF50;
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 1000;
  }
</style>