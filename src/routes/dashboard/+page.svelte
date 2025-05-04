<script>
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    import { fade, slide, scale } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    // @ts-ignore
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
     * @type {{ balance: number; user_id: any; phone?: string; } | null}
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
    let phoneNumber = '';
    let otp = '';
    let otpSent = false;
    // Add these missing variables
    let emailAddress = '';
    let isLoading = false;

    onMount(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            currentUser = JSON.parse(userData);
            // @ts-ignore
            balance = currentUser.balance;
            
            // If user has a phone number, pre-fill it
            // @ts-ignore
            if (currentUser.phone) {
                // @ts-ignore
                phoneNumber = currentUser.phone;
            }
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
        error = '';
    }
    
    async function requestOTP() {
        error = '';
        isLoading = true;
        
        // Validation code...
        
        try {
            console.log(`Sending OTP request for email: ${emailAddress}`);
            
            const response = await fetch('/api/update-user-balance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'generate_otp',
                    phone_number: phoneNumber,
                    email: emailAddress,
                    user_id: currentUser?.user_id
                })
            });
            
            const data = await response.json();
            console.log('OTP response:', data);
            
            if (data.success) {
                // Always show OTP in the success message for testing
                successMessage = `OTP sent to your email (${emailAddress}). For testing, use: ${data.otp}`;
                
                showSuccessPopup = true;
                setTimeout(() => {
                    showSuccessPopup = false;
                }, 10000); // Show for 10 seconds
                
                otpSent = true;
            } else {
                error = data.message || 'Failed to send OTP';
            }
        } catch (err) {
            console.error('Error requesting OTP:', err);
            error = 'An error occurred while requesting OTP';
        } finally {
            isLoading = false;
        }
    }
    
    async function verifyOTPAndUpdateBalance() {
        error = '';
        
        // Validate OTP
        if (!otp) {
            error = 'Please enter the OTP';
            return;
        }
        
        try {
            const response = await fetch('/api/update-user-balance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'verify_otp',
                    phone_number: phoneNumber,
                    otp: otp,
                    amount_to_add: amountToAdd,
                    user_id: currentUser?.user_id
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
                otp = '';
                otpSent = false;
                showUpdateBalanceForm = false;
                
                // Show success message
                successMessage = `Balance updated successfully! New balance: ₹${data.new_balance}`;
                showSuccessPopup = true;
                
                // Navigate to buy items page after a short delay
                setTimeout(() => {
                    showSuccessPopup = false;
                    goto('/buy-items');
                }, 3000);
            } else {
                error = data.message || 'Failed to verify OTP';
            }
        } catch (err) {
            console.error('Error verifying OTP:', err);
            error = 'An error occurred while verifying OTP';
        }
    }
    
    function cancelBalanceUpdate() {
        showUpdateBalanceForm = false;
        amountToAdd = 0;
        otp = '';
        otpSent = false;
        error = '';
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
                {#if error}
                    <div class="error-message">{error}</div>
                {/if}
                
                <div class="input-group">
                    <label for="phoneNumber">Phone Number</label>
                    <input 
                        type="tel" 
                        id="phoneNumber" 
                        placeholder="Enter your phone number" 
                        bind:value={phoneNumber}
                        disabled={otpSent}
                    />
                </div>
                
                <div class="input-group">
                    <label for="email">Email Address</label>
                    <input 
                        type="email" 
                        id="email" 
                        placeholder="Enter your email address" 
                        bind:value={emailAddress}
                        disabled={otpSent}
                    />
                </div>
                
                <div class="input-group">
                    <label for="amount">Amount to Add (₹)</label>
                    <input 
                        type="number" 
                        id="amount" 
                        placeholder="Enter amount" 
                        bind:value={amountToAdd}
                        min="1"
                        disabled={otpSent}
                    />
                </div>
                
                {#if !otpSent}
                    <div class="button-group">
                        <button class="cancel-btn" on:click={cancelBalanceUpdate}>Cancel</button>
                        <button class="send-otp-btn" on:click={requestOTP} disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </div>
                {:else}
                    <div class="otp-section">
                        <div class="input-group">
                            <label for="otp">Enter OTP</label>
                            <input 
                                type="text" 
                                id="otp" 
                                placeholder="Enter 6-digit OTP" 
                                bind:value={otp}
                                maxlength="6"
                                pattern="[0-9]*"
                                inputmode="numeric"
                            />
                        </div>
                        <p class="otp-info">
                            We've sent a 6-digit OTP to your email address ({emailAddress.substring(0, 3)}...{emailAddress.substring(emailAddress.indexOf('@'))}).
                            Please check your inbox (and spam folder) and enter the OTP to verify and update your balance.
                        </p>
                        <div class="button-group">
                            <button class="cancel-btn" on:click={cancelBalanceUpdate}>Cancel</button>
                            <button class="verify-btn" on:click={verifyOTPAndUpdateBalance}>Verify & Update</button>
                        </div>
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
    flex-direction: column;
    margin-bottom: 1.5rem;
  }

  .input-group label {
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }

  .input-group input {
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
      text-align: left;
  }
  
  .button-group {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
  }
  
  .button-group button {
      flex: 1;
      padding: 0.8rem;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
  }
  
  .cancel-btn {
      background-color: #f5f5f5;
      color: #333;
      border: 1px solid #ddd;
  }
  
  .cancel-btn:hover {
      background-color: #e5e5e5;
  }
  
  .send-otp-btn, .verify-btn {
      background-color: var(--deep-red);
      color: white;
      border: none;
  }
  
  .send-otp-btn:hover, .verify-btn:hover {
      background-color: var(--dark-red);
  }
  
  .otp-section {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background-color: #f9f9f9;
      border-radius: 8px;
      border: 1px solid #eee;
  }
  
  .otp-info {
      margin: 1rem 0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.5;
  }
  
  .error-message {
      padding: 0.8rem;
      background-color: #ffebee;
      color: #c62828;
      border-radius: 6px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
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
  
  /* Define CSS variables */
  :root {
      --deep-red: #D84040;
      --dark-red: #B03030;
      --light-beige: #F8F2DE;
      --very-light-beige: #FAF7F0;
  }
</style>