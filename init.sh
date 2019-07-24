#!/bin/bash

# git clone https://github.com/pairing-with-matt-and-mike/pairing.git
# ./pairing/init.sh
# ./pairing/nodejs.sh
# emacs # init spacemacs

# https://aws.amazon.com/ec2/pricing/on-demand/
# m5.xlarge
# m5.large

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
sudo apt -y install emacs-nox build-essential imagemagick
git clone https://github.com/syl20bnr/spacemacs.git .emacs.d
ln -s ~/pairing/dotfiles/.spacemacs ~/.spacemacs
ln -s ~/pairing/dotfiles/.tmux.conf ~/.tmux.conf

touch /tmp/pairing
echo "tmux -S /tmp/pairing" > start.sh
chmod +x start.sh
echo "tmux -S /tmp/pairing attach" > join.sh
chmod +x join.sh
