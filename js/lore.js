(() => {
	const tabs = Array.from(document.querySelectorAll('.lore-tab'));
	const panels = Array.from(document.querySelectorAll('.tab-panel'));

	if (!tabs.length || !panels.length) return;

	function activateTab(tab) {
		const targetId = tab.getAttribute('data-target');
		const targetPanel = document.getElementById(targetId);
		if (!targetPanel) return;

		// Deactivate all
		tabs.forEach(t => {
			t.classList.remove('active');
			t.setAttribute('aria-selected', 'false');
		});
		panels.forEach(p => {
			p.classList.remove('active');
			p.hidden = true;
		});

		// Activate selected
		tab.classList.add('active');
		tab.setAttribute('aria-selected', 'true');
		targetPanel.classList.add('active');
		targetPanel.hidden = false;
	}

	// Bind events
	tabs.forEach(tab => {
		tab.addEventListener('click', () => activateTab(tab));
		tab.addEventListener('keydown', (e) => {
			// Basic keyboard nav: ArrowLeft/ArrowRight cycles tabs
			if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
			e.preventDefault();
			const idx = tabs.indexOf(tab);
			const nextIdx = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
			tabs[nextIdx].focus();
			activateTab(tabs[nextIdx]);
		});
	});

	// Ensure default state (BANDOLS active) is correct
	const defaultTab = document.querySelector('.lore-tab.active') || tabs[0];
	if (defaultTab) activateTab(defaultTab);
})();
