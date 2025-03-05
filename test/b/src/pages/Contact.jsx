function Contact() {
  return (
    <div>
      <h1>Contact Us</h1>
      <form>
        <input type="text" placeholder="Your Name" required />
        <input type="email" placeholder="Your Email" required />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default Contact;
