;;; init --- Our init file  -*- lexical-binding: t -*-

;;; Commentary:
;; Lots of tweaks to our Emacs.

;;; Code:

(require 'package)

(add-to-list 'package-archives '("melpa" . "https://melpa.org/packages/"))
;; (add-to-list 'package-archives '("melpa-stable" . "https://stable.melpa.org/packages/"))

(package-initialize)

(unless package-archive-contents
  (package-refresh-contents))

(unless (package-installed-p 'use-package)
  (package-install 'use-package))

(eval-when-compile
  (require 'use-package))

(setq kill-whole-line t)
(setq mouse-yank-at-point t) ;; middle click paste at point (not mouse pointer)
(setq require-final-newline nil)
(setq scroll-conservatively 1)
(setq-default indent-tabs-mode nil)
(setq-default tab-width 4)
(fset 'yes-or-no-p 'y-or-n-p)
(delete-selection-mode t) ;; delete the selection with a keypress
(menu-bar-mode -1)
(add-hook 'before-save-hook 'delete-trailing-whitespace)
(setq set-mark-command-repeat-pop t)
(setq custom-file (expand-file-name "custom.el" user-emacs-directory))

(use-package display-line-numbers
  :hook (prog-mode . display-line-numbers-mode)
  :config
  (setq display-line-numbers-width-start t)
  (setq display-line-numbers-widen t))

(use-package selectrum
  :ensure t
  :hook (after-init . selectrum-mode)
  :config (selectrum-mode +1))

(use-package smartparens
  :ensure t
  :init
  (smartparens-global-mode 1)
  (show-smartparens-global-mode 1)
  :config
  (use-package smartparens-config)
  (sp-use-smartparens-bindings)
  (setq sp-highlight-pair-overlay nil))

(use-package magit
  :ensure t)

(provide 'init)

;;; init.el ends here
