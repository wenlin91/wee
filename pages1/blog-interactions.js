(() => {
  const pageKey = `blog-interactions:${location.pathname}`;
  const defaults = { liked: false, saved: false, comments: [] };
  let state = { ...defaults };

  try {
    const stored = JSON.parse(localStorage.getItem(pageKey) || 'null');
    if (stored && typeof stored === 'object') {
      state = {
        liked: Boolean(stored.liked),
        saved: Boolean(stored.saved),
        comments: Array.isArray(stored.comments) ? stored.comments : []
      };
    }
  } catch {
    // Local-file browser restrictions may disable storage; interactions still work for this visit.
  }

  const style = document.createElement('style');
  style.textContent = `
    .blog-interactions{max-width:860px;margin:3rem auto 2rem;padding:1.5rem;border:1px solid #e5ebe7;border-radius:18px;background:#fff;box-shadow:0 12px 36px rgba(15,45,32,.08);font:16px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color:#20352a}
    .blog-interactions *{box-sizing:border-box}
    .blog-interactions h2{margin:0 0 1rem;font-size:1.25rem}
    .blog-actions{display:flex;flex-wrap:wrap;gap:.75rem;padding-bottom:1.25rem;border-bottom:1px solid #edf1ee}
    .blog-action{display:inline-flex;align-items:center;gap:.5rem;min-height:42px;padding:.55rem 1rem;border:1px solid #dce5df;border-radius:999px;background:#fff;color:#2f4739;font:inherit;font-weight:600;font-size:.95rem;cursor:pointer;transition:background .15s,border-color .15s,transform .15s}
    .blog-action:hover{transform:translateY(-1px);border-color:#80b99a;background:#f4fbf6}
    .blog-action[aria-pressed=true]{border-color:#16834f;background:#eaf7ef;color:#087344}
    .blog-action .count{font-variant-numeric:tabular-nums}
    .blog-share-status{align-self:center;color:#087344;font-size:.9rem}
    .blog-comment-heading{display:flex;align-items:center;gap:.5rem;margin-top:1.35rem!important}
    .blog-comment-form{display:flex;gap:.6rem;margin:0 0 1rem}
    .blog-comment-input{flex:1;min-width:0;padding:.75rem .9rem;border:1px solid #dce5df;border-radius:12px;font:inherit}
    .blog-comment-input:focus{outline:2px solid #9dd7b4;border-color:#16834f}
    .blog-comment-submit{padding:.65rem 1rem;border:0;border-radius:12px;background:#087b4b;color:#fff;font:inherit;font-weight:600;font-size:.95rem;cursor:pointer}
    .blog-comment-submit:hover{background:#06663e}
    .blog-comment-list{display:grid;gap:.65rem}
    .blog-comment{padding:.8rem 1rem;border-radius:12px;background:#f5f8f6;overflow-wrap:anywhere}
    .blog-comment time{display:block;margin-bottom:.25rem;color:#718078;font-size:.8rem}
    .blog-interactions-note{margin:.9rem 0 0;color:#7b8981;font-size:.8rem}
    @media(max-width:600px){.blog-interactions{margin:2rem .75rem;padding:1rem}.blog-comment-form{flex-direction:column}.blog-comment-submit{align-self:flex-end}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.className = 'blog-interactions';
  panel.setAttribute('aria-label', 'Article interactions');
  panel.innerHTML = `
    <h2>Enjoyed this article?</h2>
    <div class="blog-actions">
      <button class="blog-action blog-like" type="button" aria-pressed="false">👍 Like <span class="count">0</span></button>
      <button class="blog-action blog-save" type="button" aria-pressed="false">🔖 Save</button>
      <button class="blog-action blog-share" type="button">↗ Share</button>
      <span class="blog-share-status" role="status" aria-live="polite"></span>
    </div>
    <h2 class="blog-comment-heading">Comments <span class="blog-comment-count">(0)</span></h2>
    <form class="blog-comment-form">
      <input class="blog-comment-input" type="text" maxlength="500" placeholder="Share your thoughts…" aria-label="Comment text" required>
      <button class="blog-comment-submit" type="submit">Post comment</button>
    </form>
    <div class="blog-comment-list" aria-live="polite"></div>
    <p class="blog-interactions-note">Likes, saves, and comments are stored in this browser only and are not uploaded to a server.</p>
  `;

  function persist() {
    try {
      localStorage.setItem(pageKey, JSON.stringify(state));
    } catch {
      // Keep the current-page state when browser storage is unavailable.
    }
  }

  const likeButton = panel.querySelector('.blog-like');
  const saveButton = panel.querySelector('.blog-save');
  const commentList = panel.querySelector('.blog-comment-list');
  const commentCount = panel.querySelector('.blog-comment-count');
  const shareStatus = panel.querySelector('.blog-share-status');

  function renderComments() {
    commentList.replaceChildren();
    state.comments.forEach(({ text, date }) => {
      const article = document.createElement('article');
      article.className = 'blog-comment';
      const time = document.createElement('time');
      time.dateTime = date;
      time.textContent = new Date(date).toLocaleString('en-US');
      const content = document.createElement('div');
      content.textContent = text;
      article.append(time, content);
      commentList.appendChild(article);
    });
    commentCount.textContent = `(${state.comments.length})`;
  }

  function renderState() {
    likeButton.setAttribute('aria-pressed', String(state.liked));
    likeButton.querySelector('.count').textContent = state.liked ? '1' : '0';
    saveButton.setAttribute('aria-pressed', String(state.saved));
    renderComments();
  }

  likeButton.addEventListener('click', () => {
    state.liked = !state.liked;
    persist();
    renderState();
  });

  saveButton.addEventListener('click', () => {
    state.saved = !state.saved;
    saveButton.textContent = state.saved ? '🔖 Saved' : '🔖 Save';
    persist();
    renderState();
  });

  panel.querySelector('.blog-share').addEventListener('click', async () => {
    const shareData = { title: document.title || document.querySelector('h1')?.textContent || 'Blog article', url: location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        shareStatus.textContent = 'Link copied';
      } else {
        window.prompt('Copy the article link:', shareData.url);
      }
    } catch (error) {
      if (error.name !== 'AbortError') shareStatus.textContent = 'Sharing failed. Copy the link from the address bar.';
    }
  });

  panel.querySelector('.blog-comment-form').addEventListener('submit', event => {
    event.preventDefault();
    const input = panel.querySelector('.blog-comment-input');
    const text = input.value.trim();
    if (!text) return;
    state.comments.push({ text, date: new Date().toISOString() });
    persist();
    input.value = '';
    renderState();
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(panel);
    renderState();
    if (state.saved) saveButton.textContent = '🔖 Saved';
  });
})();
