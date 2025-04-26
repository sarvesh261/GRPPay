<script>
  let username = '';
  let password = '';

  function handleLogin() {
    // Login logic will be implemented later
    window.location.href = '/dashboard';
  }
</script>

<div class="login-container">
  <form on:submit|preventDefault={handleLogin}>
    <h1>Login</h1>
    <input
      type="text"
      placeholder="Username"
      bind:value={username}
    />
    <input
      type="password"
      placeholder="Password"
      bind:value={password}
    />
    <button type="submit">Login</button>
  </form>
</div>

<style>
  .login-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  form {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 300px;
  }

  h1 {
    color: var(--deep-red);
    text-align: center;
  }
</style>
