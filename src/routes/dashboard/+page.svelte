<script>
    import { fade, slide, scale } from 'svelte/transition';
    import { goto } from '$app/navigation';

  let balance = 1000;
  // @ts-ignore
  /**
     * @type {string | any[]}
     */
  let members = [];
  let newMember = { username: '', password: '' };
  let showCard = false;

  function addMember() {
    // @ts-ignore
    members = [...members, { ...newMember }];
    newMember = { username: '', password: '' };
  }

  function createGroup() {
    showCard = true;
  }


    

    function proceedToBuyItems() {
        goto('/buy-items');
    }
</script>

<div class="dashboard">
  <header>
    <div class="header-content" in:fade={{ duration: 500 }}>
      <h1>Dashboard</h1>
      <div class="user-info">
        <span class="username">Welcome, User</span>
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
</style>