export async function showToast({
  icon = 'success',
  title = '',
  timer = 2000,
  router = null,
  redirectRoute = null,
  reload = false,
  callback = null,
}) {
  const Swal = await import('sweetalert2');

  return Swal.default.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
  }).then(() => {
    if (typeof callback === 'function') {
      callback();
    }

    if (redirectRoute && router) {
      router.push(redirectRoute);
    } else if (reload) {
      window.location.reload();
    }
  });
}
