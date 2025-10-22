document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep default option)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participants.length;

        // Title, description, schedule, availability
        const titleEl = document.createElement("h4");
        titleEl.textContent = name;
        const descEl = document.createElement("p");
        descEl.textContent = details.description;
        const scheduleEl = document.createElement("p");
        scheduleEl.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        const availEl = document.createElement("p");
        availEl.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        activityCard.appendChild(titleEl);
        activityCard.appendChild(descEl);
        activityCard.appendChild(scheduleEl);
        activityCard.appendChild(availEl);

        // Participants container
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants-container";
        const participantsHeader = document.createElement("strong");
        participantsHeader.textContent = `Participants (${participants.length}):`;
        participantsContainer.appendChild(participantsHeader);

        if (participants.length === 0) {
          const noneEl = document.createElement("p");
          noneEl.className = "info";
          noneEl.textContent = "No participants yet";
          participantsContainer.appendChild(noneEl);
        } else {
          const listEl = document.createElement("ul");
          listEl.className = "participants-list";

          // Helper to get display name and initials
          const getInfo = (p) => {
            if (typeof p === "string") {
              const email = p;
              const local = email.split("@")[0] || email;
              const initials = local.slice(0, 2).toUpperCase();
              return { name: email, display: email, initials };
            }
            if (p && (p.name || p.email)) {
              const display = p.name || p.email;
              const nameParts = (p.name || p.email || "").split(/\s+/).filter(Boolean);
              let initials = "";
              if (nameParts.length === 1) initials = nameParts[0].slice(0, 2).toUpperCase();
              else initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
              return { name: display, display, initials };
            }
            const s = String(p);
            return { name: s, display: s, initials: s.slice(0, 2).toUpperCase() };
          };

          const MAX_VISIBLE = 6;
          participants.forEach((p, idx) => {
            const info = getInfo(p);
            const li = document.createElement("li");
            li.className = "participant-item";
            if (idx >= MAX_VISIBLE) li.classList.add("extra", "hidden");

            const avatar = document.createElement("span");
            avatar.className = "avatar";
            avatar.textContent = info.initials;

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = info.display;
            if (typeof p === "object" && p.email) nameSpan.title = p.email;
            else if (typeof p === "string") nameSpan.title = p;

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            listEl.appendChild(li);
          });

          participantsContainer.appendChild(listEl);

          if (participants.length > MAX_VISIBLE) {
            const remaining = participants.length - MAX_VISIBLE;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "show-more";
            btn.textContent = `+${remaining} more`;
            btn.setAttribute("aria-expanded", "false");

            btn.addEventListener("click", () => {
              const isExpanded = btn.getAttribute("aria-expanded") === "true";
              const extras = listEl.querySelectorAll(".extra");
              extras.forEach((el) => {
                if (isExpanded) el.classList.add("hidden");
                else el.classList.remove("hidden");
              });
              btn.setAttribute("aria-expanded", String(!isExpanded));
              btn.textContent = isExpanded ? `+${remaining} more` : "Show less";
            });

            participantsContainer.appendChild(btn);
          }
        }

        activityCard.appendChild(participantsContainer);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities to show the new participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
