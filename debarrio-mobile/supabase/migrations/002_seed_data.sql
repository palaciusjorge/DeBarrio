
-- =====================================================
-- 002_seed_data.sql
-- Datos iniciales de la base de datos de DeBarrio
-- =====================================================


-- =====================================================
-- 1. CATEGORÍAS INICIALES
-- Categorías principales para clasificar los negocios.
-- =====================================================

INSERT INTO public.categories (name, description)
VALUES
    (
        'Restauración',
        'Restaurantes, bares, cafeterías y establecimientos de comida.'
    ),
    (
        'Alimentación',
        'Tiendas de alimentación, supermercados, panaderías y comercios de productos alimenticios.'
    ),
    (
        'Moda',
        'Tiendas de ropa, calzado, complementos y accesorios.'
    ),
    (
        'Salud y bienestar',
        'Centros de salud, farmacias, clínicas y establecimientos de bienestar.'
    ),
    (
        'Hogar',
        'Tiendas de muebles, decoración, electrodomésticos y artículos para el hogar.'
    ),
    (
        'Servicios',
        'Negocios que ofrecen servicios profesionales y personales.'
    ),
    (
        'Ocio',
        'Actividades de ocio, entretenimiento, cultura y tiempo libre.'
    ),
    (
        'Tecnología',
        'Tiendas de informática, electrónica y servicios tecnológicos.'
    )
ON CONFLICT (name) DO NOTHING;


-- =====================================================
-- FIN DE LOS DATOS INICIALES DE DEBARRIO
-- =====================================================
