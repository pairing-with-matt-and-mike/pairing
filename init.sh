#!/bin/bash

# git clone https://github.com/pairing-with-matt-and-mike/pairing.git
# ./pairing/init.sh

# https://aws.amazon.com/ec2/pricing/on-demand/

function add-user {
    GH_USERNAME=$1
    mkdir -p ~/.ssh
    wget https://github.com/$GH_USERNAME.keys -qO- >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
}

add-user thatismatt
add-user mwilliamson
add-user liwp

sudo apt -y update
sudo apt -y install emacs-nox build-essential python3-venv openjdk-8-jdk-headless imagemagick entr
ln -s ~/pairing/dotfiles/.emacs.d ~/.emacs.d
ln -s ~/pairing/dotfiles/.tmux.conf ~/.tmux.conf

touch /tmp/pairing
echo "tmux -S /tmp/pairing" > start.sh
chmod +x start.sh
echo "tmux -S /tmp/pairing attach" > join.sh
chmod +x join.sh

# http://elpa.gnu.org/packages/gnu-elpa-keyring-update.html
mkdir -p ~/.emacs.d/elpa/gnupg
gpg --homedir ~/.emacs.d/elpa/gnupg --receive-keys 066DAFCB81E42C40

# emacs --batch -l ~/.emacs.d/init.el --eval="(configuration-layer/update-packages t)"

~/pairing/nodejs.sh
~/pairing/clojure.sh
