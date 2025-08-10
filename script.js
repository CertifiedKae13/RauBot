document.addEventListener('DOMContentLoaded', () => {
    const discordInviteButton = document.getElementById('discord-invite');
    const discordInviteLink = 'https://discord.gg/your-invite-code'; // Placeholder

    discordInviteButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = discordInviteLink;
    });
});
