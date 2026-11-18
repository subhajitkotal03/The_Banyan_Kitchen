// =============================================================================
// The Banyan Kitchen - Contact Form JavaScript
// =============================================================================

var contactForm = document.getElementById("contactForm");
var contactName = document.getElementById("contactName");
var contactEmail = document.getElementById("contactEmail");
var contactMessage = document.getElementById("contactMessage");
var contactMessageResult = document.getElementById("contactMessageResult");

if (contactForm) {
  contactForm.addEventListener("submit", function(event) {
    event.preventDefault();
    contactMessageResult.textContent = "";

    var messageData = {
      name: contactName.value.trim(),
      email: contactEmail.value.trim(),
      message: contactMessage.value.trim()
    };

    sendRequest(
      "/api/messages",
      "POST",
      messageData,
      function(reply) {
        contactMessageResult.className = "small text-success mt-3 mb-0";
        contactMessageResult.textContent = reply.message;
        contactForm.reset();
      },
      function(errorMessage) {
        contactMessageResult.className = "small text-danger mt-3 mb-0";
        contactMessageResult.textContent = errorMessage;
      }
    );
  });
}
